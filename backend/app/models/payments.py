# app/models/payments.py
from sqlalchemy import String, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import TYPE_CHECKING
from app.database import AbstractModel

if TYPE_CHECKING:
    from app.models.users import Users

class UtilityService(AbstractModel):
    """Модель услуги ЖКХ"""
    __tablename__ = "utility_services"
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)

class Payment(AbstractModel):
    """Модель платежа"""
    __tablename__ = "payments"
    
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey('utility_services.id'), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    period: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='pending')
    payment_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    transaction_id: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Relationships
    user: Mapped["Users"] = relationship("Users", back_populates="payments")
    service: Mapped["UtilityService"] = relationship("UtilityService")

class MeterReading(AbstractModel):
    """Модель показаний счетчиков"""
    __tablename__ = "meter_readings"
    
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey('utility_services.id'), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reading_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    period: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    user: Mapped["Users"] = relationship("Users", back_populates="meter_readings")
    service: Mapped["UtilityService"] = relationship("UtilityService")

class Receipt(AbstractModel):
    """Модель квитанции"""
    __tablename__ = "receipts"
    
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    period: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    generated_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(20), default='generated')

    # Relationships
    user: Mapped["Users"] = relationship("Users", back_populates="receipts")
