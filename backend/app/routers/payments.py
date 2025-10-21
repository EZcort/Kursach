# app/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.payment_repo import PaymentRepository, MeterReadingRepository, ReceiptRepository
from app.schemas.payments import *
from app.routers.Auth import security

router = APIRouter(prefix='/payments', tags=['Payments'])

@router.get('/services', response_model=List[UtilityServiceResponseSchema])
async def get_utility_services(db: AsyncSession = Depends(get_db)):
    """Получить список услуг ЖКХ"""
    return await PaymentRepository.get_utility_services(db)

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
    return await PaymentRepository.get_user_payments(db, user_id)

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
    """Обработать платеж (заглушка)"""
    # Здесь должна быть логика интеграции с платежной системой
    payment = await PaymentRepository.get_payment_by_id(db, payment_info.payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Платеж не найден")
    
    if payment.user_id != int(token_payload.sub):
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Заглушка для успешного платежа
    await PaymentRepository.update_payment_status(db, payment_info.payment_id, 'completed', 'txn_12345')
    
    return {"message": "Платеж успешно обработан", "status": "completed"}

# В app/routers/payments.py добавьте:

@router.get('/my-readings', response_model=List[MeterReadingResponseSchema])
async def get_my_readings(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить показания пользователя"""
    user_id = int(token_payload.sub)
    readings = await MeterReadingRepository.get_user_readings(db, user_id)
    return readings

@router.get('/my-receipts', response_model=List[ReceiptResponseSchema])
async def get_my_receipts(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить квитанции пользователя"""
    user_id = int(token_payload.sub)
    receipts = await ReceiptRepository.get_user_receipts(db, user_id)
    return receipts
