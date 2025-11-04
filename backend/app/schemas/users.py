# app/schemas/users.py
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = 'user'
    address: Optional[str] = None
    phone: Optional[str] = None

class UserResponseSchema(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    address: Optional[str]
    phone: Optional[str]
    balance: float  # Добавляем баланс в ответ

    class Config:
        from_attributes = True

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

# Добавляем новые схемы для работы с балансом
class BalanceDepositSchema(BaseModel):
    amount: float
    description: Optional[str] = "Пополнение баланса"

class BalanceTransactionResponseSchema(BaseModel):
    id: int
    user_id: int
    amount: float
    transaction_type: str
    description: Optional[str]
    status: str
    transaction_date: datetime
    reference_id: Optional[str]

    class Config:
        from_attributes = True
