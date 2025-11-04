# app/models/users.py
from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from app.database import AbstractModel

if TYPE_CHECKING:
    from app.models.payments import Payment, MeterReading, Receipt, BalanceTransaction

class Users(AbstractModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default='user')
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    balance: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)  # Добавляем баланс
    
    # Relationships
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="user")
    meter_readings: Mapped[List["MeterReading"]] = relationship("MeterReading", back_populates="user")
    receipts: Mapped[List["Receipt"]] = relationship("Receipt", back_populates="user")
    balance_transactions: Mapped[List["BalanceTransaction"]] = relationship("BalanceTransaction", back_populates="user")
