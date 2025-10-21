# app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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

def require_admin(token_payload: dict = Depends(security.access_token_required)):
    """Проверка прав администратора"""
    if token_payload.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return token_payload

@router.get('/users', response_model=List[UserResponseSchema])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    token_payload: dict = Depends(require_admin)
):
    """Получить список всех пользователей"""
    result = await db.execute(select(Users))
    return result.scalars().all()

@router.get('/payments', response_model=List[PaymentResponseSchema])
async def get_all_payments(
    db: AsyncSession = Depends(get_db),
    token_payload: dict = Depends(require_admin)
):
    """Получить все платежи"""
    result = await db.execute(select(Payment).order_by(Payment.period.desc()))
    return result.scalars().all()

@router.get('/meter-readings', response_model=List[MeterReadingResponseSchema])
async def get_all_readings(
    db: AsyncSession = Depends(get_db),
    token_payload: dict = Depends(require_admin)
):
    """Получить все показания счетчиков"""
    result = await db.execute(select(MeterReading).order_by(MeterReading.period.desc()))
    return result.scalars().all()

@router.post('/utility-services', response_model=UtilityServiceResponseSchema)
async def create_utility_service(
    service_data: UtilityServiceCreateSchema,
    db: AsyncSession = Depends(get_db),
    token_payload: dict = Depends(require_admin)
):
    """Создать услугу ЖКХ"""
    service = UtilityService(**service_data.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service

@router.put('/utility-services/{service_id}', response_model=UtilityServiceResponseSchema)
async def update_utility_service(
    service_id: int,
    service_data: UtilityServiceCreateSchema,
    db: AsyncSession = Depends(get_db),
    token_payload: dict = Depends(require_admin)
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
    return service

@router.post('/generate-receipts')
async def generate_receipts(
    period: datetime,
    db: AsyncSession = Depends(get_db),
    token_payload: dict = Depends(require_admin)
):
    """Сгенерировать квитанции для всех пользователей (заглушка)"""
    # Здесь должна быть логика расчета сумм и генерации квитанций
    return {"message": "Квитанции сгенерированы", "period": period}
