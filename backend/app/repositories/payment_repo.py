# app/repositories/payment_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.payments import Payment, UtilityService, MeterReading, Receipt
from typing import List, Optional
from datetime import datetime

class PaymentRepository:
    
    @staticmethod
    async def get_utility_services(session: AsyncSession) -> List[UtilityService]:
        result = await session.execute(
            select(UtilityService).where(UtilityService.is_active == True)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_user_payments(session: AsyncSession, user_id: int) -> List[Payment]:
        result = await session.execute(
            select(Payment)
            .options(selectinload(Payment.service))  # Явно загружаем связанную услугу
            .where(Payment.user_id == user_id)
            .order_by(Payment.period.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def create_payment(session: AsyncSession, payment_data: dict) -> Payment:
        payment = Payment(**payment_data)
        session.add(payment)
        await session.commit()
        await session.refresh(payment)
        return payment
    
    @staticmethod
    async def get_payment_by_id(session: AsyncSession, payment_id: int) -> Optional[Payment]:
        result = await session.execute(
            select(Payment)
            .options(selectinload(Payment.service))
            .where(Payment.id == payment_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_payment_status(session: AsyncSession, payment_id: int, status: str, transaction_id: str = None) -> Payment:
        payment = await PaymentRepository.get_payment_by_id(session, payment_id)
        if payment:
            payment.status = status
            if status == 'completed':
                payment.payment_date = datetime.utcnow()
            if transaction_id:
                payment.transaction_id = transaction_id
            await session.commit()
            await session.refresh(payment)
        return payment

class MeterReadingRepository:
    
    @staticmethod
    async def submit_reading(session: AsyncSession, reading_data: dict) -> MeterReading:
        reading = MeterReading(**reading_data)
        session.add(reading)
        await session.commit()
        await session.refresh(reading)
        return reading
    
    @staticmethod
    async def get_user_readings(session: AsyncSession, user_id: int) -> List[MeterReading]:
        result = await session.execute(
            select(MeterReading)
            .options(selectinload(MeterReading.service))  # Явно загружаем связанную услугу
            .where(MeterReading.user_id == user_id)
            .order_by(MeterReading.period.desc())
        )
        return result.scalars().all()

class ReceiptRepository:
    
    @staticmethod
    async def generate_receipt(session: AsyncSession, receipt_data: dict) -> Receipt:
        receipt = Receipt(**receipt_data)
        session.add(receipt)
        await session.commit()
        await session.refresh(receipt)
        return receipt
    
    @staticmethod
    async def get_user_receipts(session: AsyncSession, user_id: int) -> List[Receipt]:
        result = await session.execute(
            select(Receipt)
            .where(Receipt.user_id == user_id)
            .order_by(Receipt.period.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_utility_services(session: AsyncSession) -> List[UtilityService]:
        result = await session.execute(
            select(UtilityService).order_by(UtilityService.is_active.desc(), UtilityService.name))
        return result.scalars().all()
