# app/schemas/payments.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UtilityServiceCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    unit: str
    rate: float

class UtilityServiceResponseSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    unit: str
    rate: float
    is_active: bool

    class Config:
        from_attributes = True

class MeterReadingCreateSchema(BaseModel):
    service_id: int
    value: float
    period: datetime

class MeterReadingResponseSchema(BaseModel):
    id: int
    user_id: int
    service_id: int
    value: float
    reading_date: datetime
    period: datetime
    service: Optional[UtilityServiceResponseSchema] = None

    class Config:
        from_attributes = True

class PaymentCreateSchema(BaseModel):
    service_id: int
    amount: float
    period: datetime

class PaymentResponseSchema(BaseModel):
    id: int
    user_id: int
    service_id: int
    amount: float
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
    status: str

    class Config:
        from_attributes = True

class PaymentProcessingSchema(BaseModel):
    payment_id: int
    card_number: str
    expiry_date: str
    cvv: str
