from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLoginSchema(BaseModel):
    username: str
    password: str

class UserResponseSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    
    class Config:
        from_attributes = True

class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = 'user'
