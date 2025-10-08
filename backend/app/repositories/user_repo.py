from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.users import Users
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRepository:
    
    @staticmethod
    def hash_password(password: str) -> str:
        return password

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
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
        hashed_password = UserRepository.hash_password(user_data['password'])
        user = Users(
            email=user_data['email'],
            password=hashed_password,
            full_name=user_data['full_name'],
            role=user_data.get('role', 'user')
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
