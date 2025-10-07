from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.users import Users

async def create_test_data():
    async with AsyncSessionLocal() as session:
        # Проверяем, есть ли уже пользователи используя ORM
        result = await session.execute(select(Users).limit(1))
        existing_user = result.scalars().first()
        
        if not existing_user:
            # Создаем тестовых пользователей
            test_users = [
                Users(
                    email="admin@example.com",
                    password="admin123",
                    full_name="Admin User",
                    role="admin"
                ),
                Users(
                    email="user@example.com",
                    password="user123",
                    full_name="Regular User",
                    role="user"
                ),
                Users(
                    email="manager@example.com",
                    password="manager123",
                    full_name="Manager User",
                    role="manager"
                )
            ]
            
            session.add_all(test_users)
            await session.commit()
            print("✅ Test data created successfully!")
        else:
            print("ℹ️ Test data already exists, skipping...")
