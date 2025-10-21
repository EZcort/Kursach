# app/repositories/user_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.users import Users

class UserRepository:
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Просто возвращаем пароль без хеширования"""
        return password

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Просто сравниваем пароли без хеширования"""
        return plain_password == hashed_password
        
    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> Users | None:
        result = await session.execute(select(Users).where(Users.email == email))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: int) -> Users | None:
        result = await session.execute(select(Users).where(Users.id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def verify_user_credentials(session: AsyncSession, email: str, password: str) -> Users | None:
        user = await UserRepository.get_user_by_email(session, email)
        if user and UserRepository.verify_password(password, user.password):
            return user
        return None
    
    @staticmethod
    async def create_user(session: AsyncSession, user_data: dict) -> Users:
        # Сохраняем пароль как есть, без хеширования
        user = Users(
            email=user_data['email'],
            password=user_data['password'],
            full_name=user_data['full_name'],
            role=user_data.get('role', 'user'),
            address=user_data.get('address'),
            phone=user_data.get('phone')
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
