# app/schemas/payments.py
from pydantic import BaseModel
from typing import Dict, Optional, List
from datetime import datetime
from decimal import Decimal

class UtilityServiceCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    unit: str
    rate: float  # Frontend отправляет float

class UtilityServiceResponseSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    unit: str
    rate: float  # Конвертируем Decimal в float для фронтенда
    is_active: bool

    class Config:
        from_attributes = True

class MeterReadingCreateSchema(BaseModel):
    service_id: int
    value: float  # Frontend отправляет float
    period: datetime

class MeterReadingResponseSchema(BaseModel):
    id: int
    user_id: int
    service_id: int
    value: float  # Конвертируем Decimal в float
    reading_date: datetime
    period: datetime
    service: Optional[UtilityServiceResponseSchema] = None

    class Config:
        from_attributes = True

class PaymentCreateSchema(BaseModel):
    service_id: int
    amount: float  # Frontend отправляет float
    period: datetime

class PaymentResponseSchema(BaseModel):
    id: int
    user_id: int
    service_id: int
    amount: float  # Конвертируем Decimal в float
    status: str
    period: datetime
    payment_date: Optional[datetime]
    transaction_id: Optional[str]
    service: Optional[UtilityServiceResponseSchema] = None

    class Config:
        from_attributes = True

class ReceiptResponseSchema(BaseModel):
    id: int
    user_id: int
    total_amount: float
    period: datetime
    generated_date: datetime
    status: str  # 'generated', 'paid', 'overdue'

    class Config:
        from_attributes = True

class ReceiptItemResponseSchema(BaseModel):
    id: int
    receipt_id: int
    service_id: int
    quantity: float
    rate: float
    amount: float
    service: Optional[UtilityServiceResponseSchema] = None

    class Config:
        from_attributes = True

class ReceiptDetailResponseSchema(BaseModel):
    id: int
    user_id: int
    total_amount: float
    period: datetime
    generated_date: datetime
    status: str
    receipt_items: List[ReceiptItemResponseSchema] = []

    class Config:
        from_attributes = True

class ReceiptComparisonSchema(BaseModel):
    current_receipt: ReceiptDetailResponseSchema
    previous_receipt: Optional[ReceiptDetailResponseSchema] = None
    consumption_changes: Dict[str, Dict[str, float]] = {}  # Изменения потребления по услугам

    class Config:
        from_attributes = True

class PaymentProcessingSchema(BaseModel):
    payment_id: int
    card_number: str
    expiry_date: str
    cvv: str

# Новые схемы для баланса
class BalanceDepositSchema(BaseModel):
    amount: float  # Frontend отправляет float
    description: Optional[str] = "Пополнение баланса"

class BalanceTransactionResponseSchema(BaseModel):
    id: int
    user_id: int
    amount: float  # Конвертируем Decimal в float
    transaction_type: str
    description: Optional[str]
    status: str
    transaction_date: datetime
    reference_id: Optional[str]

    class Config:
        from_attributes = True

class BalanceInfoResponseSchema(BaseModel):
    user_id: int
    balance: float  # Конвертируем Decimal в float
    currency: str

    class Config:
        from_attributes = True
