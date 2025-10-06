from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Users
from app.schemas.users import UserLogicSchema

class UserRepository:
    
    @staticmethod
    async def get_user_by_username(session: AsyncSession, username: str) -> Users | None:
        """Найти пользователя по email (username)"""
        query = select(Users).where(Users.email == username)
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def verify_user_credentials(session: AsyncSession,username: str, password: str ) -> Users | None:
        """Проверить учетные данные пользователя"""
        user = await UserRepository.get_user_by_username(session, username)
        
        # В реальном приложении здесь должно быть сравнение хешей паролей
        if user and user.password == password:  # ⚠️ Замените на проверку хеша!
            return user
        return None
    
    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: int) -> Users | None:
        """Найти пользователя по ID"""
        result = await session.get(Users, user_id)
        return result
