# app/database.py
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import as_declarative, declared_attr
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

@as_declarative()
class AbstractModel:
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    @declared_attr.directive
    @classmethod
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        # Импортируем все модели для регистрации
        from app.models import users, payments
        await conn.run_sync(AbstractModel.metadata.create_all)
    
    # Заполняем базу начальными данными
    async with AsyncSessionLocal() as session:
        from app.seed_data import seed_database
        await seed_database(session)
