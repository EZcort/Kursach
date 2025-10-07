from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional

class UserResponseSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True
    )

class UserLoginSchema(BaseModel):
    email: EmailStr = Field(..., description="Email пользователя")
    password: str = Field(..., min_length=1, description="Пароль")

class UserCreateSchema(BaseModel):
    email: EmailStr = Field(..., description="Email пользователя")
    password: str = Field(..., min_length=1, description="Пароль")
    full_name: str = Field(..., min_length=1, description="Полное имя")
    role: Optional[str] = Field(default='user', description="Роль пользователя")
