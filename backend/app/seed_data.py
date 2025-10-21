# app/seed_data.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import UserRepository
from app.repositories.payment_repo import PaymentRepository
from app.models.payments import UtilityService
from datetime import datetime

async def seed_database(session: AsyncSession):
    """Заполнение базы данных начальными данными"""
    
    # Проверяем, есть ли уже данные
    result = await session.execute("SELECT COUNT(*) FROM users")
    user_count = result.scalar()
    
    if user_count > 0:
        print("База данных уже содержит данные, пропускаем заполнение")
        return
    
    print("Заполняем базу данных начальными данными...")
    
    # Создаем услуги ЖКХ
    utility_services = [
        UtilityService(
            name="Электроэнергия",
            description="Подача электрической энергии",
            unit="кВт·ч",
            rate=4.5,
            is_active=True
        ),
        UtilityService(
            name="Водоснабжение",
            description="Подача холодной воды",
            unit="м³",
            rate=35.2,
            is_active=True
        ),
        UtilityService(
            name="Отопление",
            description="Обогрев помещений",
            unit="Гкал",
            rate=1800.0,
            is_active=True
        ),
        UtilityService(
            name="Газоснабжение",
            description="Подача природного газа",
            unit="м³",
            rate=6.8,
            is_active=True
        )
    ]
    
    for service in utility_services:
        session.add(service)
    
    await session.commit()
    
    # Создаем пользователей
    users_data = [
        {
            'email': 'admin@example.com',
            'password': 'admin123',
            'full_name': 'Главный Администратор',
            'role': 'admin',
            'address': 'ул. Центральная, д. 1, кв. 1',
            'phone': '+7 (999) 123-45-67'
        },
        {
            'email': 'user1@example.com',
            'password': 'user123',
            'full_name': 'Иван Петров',
            'role': 'user',
            'address': 'ул. Ленина, д. 10, кв. 25',
            'phone': '+7 (999) 234-56-78'
        },
        {
            'email': 'user2@example.com',
            'password': 'user123',
            'full_name': 'Мария Сидорова',
            'role': 'user',
            'address': 'ул. Пушкина, д. 5, кв. 12',
            'phone': '+7 (999) 345-67-89'
        },
        {
            'email': 'user3@example.com',
            'password': 'user123',
            'full_name': 'Алексей Козлов',
            'role': 'user',
            'address': 'ул. Гагарина, д. 15, кв. 8',
            'phone': '+7 (999) 456-78-90'
        }
    ]
    
    created_users = []
    for user_data in users_data:
        user = await UserRepository.create_user(session, user_data)
        created_users.append(user)
        print(f"Создан пользователь: {user.email} ({user.role})")
    
    # Создаем тестовые платежи для обычных пользователей
    from app.models.payments import Payment, MeterReading
    
    # Только для обычных пользователей (не админа)
    regular_users = [user for user in created_users if user.role == 'user']
    
    for user in regular_users:
        # Создаем платежи
        for i, service in enumerate(utility_services):
            payment = Payment(
                user_id=user.id,
                service_id=service.id,
                amount=150.0 + (i * 50),  # Разные суммы для разных услуг
                period=datetime(2024, 1, 1),
                status='completed',
                payment_date=datetime(2024, 1, 5),
                transaction_id=f'txn_{user.id}_{service.id}'
            )
            session.add(payment)
        
        # Создаем показания счетчиков
        for service in utility_services:
            reading = MeterReading(
                user_id=user.id,
                service_id=service.id,
                value=100.0 + (user.id * 10),  # Разные показания
                reading_date=datetime(2024, 1, 1),
                period=datetime(2024, 1, 1)
            )
            session.add(reading)
    
    await session.commit()
    print("Начальные данные успешно добавлены в базу данных!")

# В seed_data.py добавьте:
async def seed_database(session: AsyncSession, force: bool = False):
    if not force:
        result = await session.execute("SELECT COUNT(*) FROM users")
        user_count = result.scalar()
        if user_count > 0:
            print("База данных уже содержит данные, пропускаем заполнение")
            return
