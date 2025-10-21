# app/schemas/users.py
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

    class Config:
        from_attributes = True

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str
