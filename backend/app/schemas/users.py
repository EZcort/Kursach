from pydantic import BaseModel, ConfigDict, EmailStr
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
    username: str
    password: str

class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = 'user'
