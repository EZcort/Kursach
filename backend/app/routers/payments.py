# app/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.repositories.payment_repo import PaymentRepository, MeterReadingRepository, ReceiptRepository
from app.repositories.balance_repo import BalanceRepository
from app.schemas.payments import *
from app.routers.Auth import security
from app.models.payments import Receipt
from datetime import datetime
from typing import List
from decimal import Decimal

router = APIRouter(prefix='/payments', tags=['Payments'])

@router.get('/services', response_model=List[UtilityServiceResponseSchema])
async def get_utility_services(db: AsyncSession = Depends(get_db)):
    """Получить список услуг ЖКХ"""
    services = await PaymentRepository.get_utility_services(db)
    return [UtilityServiceResponseSchema.model_validate(service) for service in services]

@router.post('/submit-reading')
async def submit_meter_reading(
    reading_data: MeterReadingCreateSchema,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Подать показания счетчика"""
    user_id = int(token_payload.sub)
    reading_dict = reading_data.model_dump()
    reading_dict['user_id'] = user_id
    
    reading = await MeterReadingRepository.submit_reading(db, reading_dict)
    return {"message": "Показания успешно поданы", "reading_id": reading.id}

@router.get('/my-payments', response_model=List[PaymentResponseSchema])
async def get_my_payments(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить историю платежей пользователя"""
    user_id = int(token_payload.sub)
    payments = await PaymentRepository.get_user_payments(db, user_id)
    return [PaymentResponseSchema.model_validate(payment) for payment in payments]

@router.get('/my-readings', response_model=List[MeterReadingResponseSchema])
async def get_my_readings(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить показания пользователя"""
    user_id = int(token_payload.sub)
    readings = await MeterReadingRepository.get_user_readings(db, user_id)
    return [MeterReadingResponseSchema.model_validate(reading) for reading in readings]

@router.get('/my-receipts', response_model=List[ReceiptResponseSchema])
async def get_my_receipts(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить квитанции пользователя"""
    user_id = int(token_payload.sub)
    receipts = await ReceiptRepository.get_user_receipts(db, user_id)
    return [ReceiptResponseSchema.model_validate(receipt) for receipt in receipts]

@router.post('/create-payment')
async def create_payment(
    payment_data: PaymentCreateSchema,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Создать платеж"""
    user_id = int(token_payload.sub)
    payment_dict = payment_data.model_dump()
    payment_dict['user_id'] = user_id
    
    payment = await PaymentRepository.create_payment(db, payment_dict)
    return {"message": "Платеж создан", "payment_id": payment.id}

@router.post('/process-payment')
async def process_payment(
    payment_info: PaymentProcessingSchema,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Обработать платеж с использованием баланса"""
    user_id = int(token_payload.sub)
    
    # Получаем информацию о платеже
    payment = await PaymentRepository.get_payment_by_id(db, payment_info.payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Платеж не найден")
    
    if payment.user_id != user_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if payment.status == 'completed':
        raise HTTPException(status_code=400, detail="Платеж уже обработан")
    
    # Проверяем баланс пользователя
    user_balance = await BalanceRepository.get_user_balance(db, user_id)
    
    if user_balance < payment.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Недостаточно средств на балансе. Требуется: {float(payment.amount)}, доступно: {float(user_balance)}"
        )
    
    try:
        # Списание средств с баланса
        await BalanceRepository.withdraw_balance(
            db,
            user_id,
            float(payment.amount),  # Конвертируем Decimal в float
            description=f"Оплата услуги: {payment.service.name if payment.service else 'Услуга'}",
            reference_id=f"payment_{payment.id}"
        )
        
        # Обновление статуса платежа
        await PaymentRepository.update_payment_status(
            db, 
            payment_info.payment_id, 
            'completed', 
            f"balance_{payment.id}"
        )
        
        # ✅ АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ СТАТУСА КВИТАНЦИИ
        # Ищем квитанцию по периоду и сумме (примерное соответствие)
        result = await db.execute(
            select(Receipt)
            .where(
                Receipt.user_id == user_id,
                Receipt.period == payment.period,
                Receipt.status == 'generated'
            )
        )
        receipts = result.scalars().all()
        
        receipt_updated = False
        if receipts:
            # Находим наиболее подходящую квитанцию по сумме
            target_receipt = None
            for receipt in receipts:
                # Сравниваем суммы с допуском (на случай округления)
                if abs(float(receipt.total_amount) - float(payment.amount)) < 1.0:
                    target_receipt = receipt
                    break
            
            # Если нашли подходящую квитанцию - обновляем статус
            if target_receipt:
                target_receipt.status = 'paid'
                receipt_updated = True
                print(f"Статус квитанции {target_receipt.id} обновлен на 'paid'")
        
        await db.commit()
        
        return {
            "message": "Платеж успешно обработан", 
            "status": "completed",
            "amount": float(payment.amount),
            "payment_method": "balance",
            "receipt_updated": receipt_updated
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
