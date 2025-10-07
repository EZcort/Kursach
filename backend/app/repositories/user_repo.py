from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import Users

class UserRepository:
    
    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> Users | None:
        """Найти пользователя по email"""
        query = select(Users).where(Users.email == email)
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def verify_user_credentials(session: AsyncSession, email: str, password: str) -> Users | None:
        """Проверить учетные данные пользователя"""
        user = await UserRepository.get_user_by_email(session, email)
        if user and user.password == password:
            return user
        return None
    
    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: int) -> Users | None:
        """Найти пользователя по ID"""
        result = await session.get(Users, user_id)
        return result
    
    @staticmethod
    async def create_user(session: AsyncSession, user_data: dict) -> Users:
        """Создать нового пользователя"""
        user = Users(**user_data)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
