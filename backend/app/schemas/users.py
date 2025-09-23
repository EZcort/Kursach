from pydantic import BaseModel


class UserLogicSchema(BaseModel):
    username: str
    password: str
