# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from app.database import get_db
from app.repositories.user_repo import UserRepository
from app.repositories.payment_repo import PaymentRepository, MeterReadingRepository, ReceiptRepository
from app.schemas.payments import *
from app.schemas.users import UserResponseSchema
from app.routers.Auth import security
from app.models.users import Users
from app.models.payments import Payment, MeterReading, UtilityService, Receipt
from datetime import datetime
from typing import List

router = APIRouter(prefix='/admin', tags=['Admin'])

def require_admin(token_payload = Depends(security.access_token_required)):
    """Проверка прав администратора"""
    if token_payload.role != 'admin':
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return token_payload

@router.get('/users', response_model=List[UserResponseSchema])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Получить список всех пользователей"""
    result = await db.execute(select(Users))
    users = result.scalars().all()
    return [UserResponseSchema.model_validate(user) for user in users]

@router.get('/payments', response_model=List[PaymentResponseSchema])
async def get_all_payments(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Получить все платежи"""
    result = await db.execute(
        select(Payment)
        .options(selectinload(Payment.service))
        .order_by(Payment.period.desc())
    )
    payments = result.scalars().all()
    return [PaymentResponseSchema.model_validate(payment) for payment in payments]

@router.get('/meter-readings', response_model=List[MeterReadingResponseSchema])
async def get_all_readings(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Получить все показания счетчиков"""
    result = await db.execute(
        select(MeterReading)
        .options(selectinload(MeterReading.service))
        .order_by(MeterReading.period.desc())
    )
    readings = result.scalars().all()
    return [MeterReadingResponseSchema.model_validate(reading) for reading in readings]

@router.get('/utility-services', response_model=List[UtilityServiceResponseSchema])
async def get_all_utility_services(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Получить все услуги ЖКХ (включая неактивные) для админки"""
    result = await db.execute(
        select(UtilityService).order_by(UtilityService.is_active.desc(), UtilityService.name)
    )
    services = result.scalars().all()
    return [UtilityServiceResponseSchema.model_validate(service) for service in services]

@router.post('/utility-services', response_model=UtilityServiceResponseSchema)
async def create_utility_service(
    service_data: UtilityServiceCreateSchema,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Создать услугу ЖКХ"""
    service = UtilityService(**service_data.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return UtilityServiceResponseSchema.model_validate(service)

@router.put('/utility-services/{service_id}', response_model=UtilityServiceResponseSchema)
async def update_utility_service(
    service_id: int,
    service_data: UtilityServiceCreateSchema,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Обновить услугу ЖКХ"""
    result = await db.execute(select(UtilityService).where(UtilityService.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    
    for field, value in service_data.model_dump().items():
        setattr(service, field, value)
    
    await db.commit()
    await db.refresh(service)
    return UtilityServiceResponseSchema.model_validate(service)

@router.delete('/utility-services/{service_id}')
async def delete_utility_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Удалить услугу ЖКХ"""
    result = await db.execute(select(UtilityService).where(UtilityService.id == service_id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    
    # Проверяем, нет ли связанных платежей или показаний
    payments_count_result = await db.execute(select(func.count(Payment.id)).where(Payment.service_id == service_id))
    readings_count_result = await db.execute(select(func.count(MeterReading.id)).where(MeterReading.service_id == service_id))
    
    payments_count = payments_count_result.scalar()
    readings_count = readings_count_result.scalar()
    
    if payments_count > 0 or readings_count > 0:
        # Вместо удаления делаем услугу неактивной
        service.is_active = False
        await db.commit()
        return {"message": "Услуга деактивирована (есть связанные данные)"}
    else:
        # Если нет связанных данных - удаляем полностью
        await db.delete(service)
        await db.commit()
        return {"message": "Услуга удалена"}

@router.post('/generate-receipts')
async def generate_receipts(
    period: datetime,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(require_admin)
):
    """Сгенерировать квитанции для всех пользователей (заглушка)"""
    return {"message": "Квитанции сгенерированы", "period": period}
