# app/seed_data.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.user_repo import UserRepository
from app.models.payments import ReceiptItem, UtilityService, Payment, MeterReading, BalanceTransaction, Receipt
from app.models.users import Users
from datetime import datetime, timedelta
from decimal import Decimal

async def seed_database(session: AsyncSession):
    """Заполнение базы данных начальными данными"""
    
    # Проверяем, есть ли уже данные
    result = await session.execute(select(Users))
    users = result.scalars().all()
    
    if users:
        print("База данных уже содержит данные, пропускаем заполнение")
        return
    
    print("Заполняем базу данных начальными данными...")
    
    # Создаем услуги ЖКХ
    utility_services = [
        UtilityService(
            name="Электроэнергия",
            description="Подача электрической энергии",
            unit="кВт·ч",
            rate=Decimal('4.5'),
            is_active=True
        ),
        UtilityService(
            name="Водоснабжение",
            description="Подача холодной воды",
            unit="м³",
            rate=Decimal('35.2'),
            is_active=True
        ),
        UtilityService(
            name="Отопление",
            description="Обогрев помещений",
            unit="Гкал",
            rate=Decimal('1800.0'),
            is_active=True
        ),
        UtilityService(
            name="Газоснабжение",
            description="Подача природного газа",
            unit="м³",
            rate=Decimal('6.8'),
            is_active=True
        ),
        UtilityService(
            name="Вывоз ТБО",
            description="Вывоз твердых бытовых отходов",
            unit="мес",
            rate=Decimal('150.0'),
            is_active=True
        ),
        UtilityService(
            name="Капитальный ремонт",
            description="Взнос на капитальный ремонт",
            unit="м²",
            rate=Decimal('8.5'),
            is_active=True
        )
    ]
    
    for service in utility_services:
        session.add(service)
    
    await session.commit()
    print("Услуги ЖКХ созданы")
    
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
        },
        {
            'email': 'user4@example.com',
            'password': 'user123',
            'full_name': 'Елена Волкова',
            'role': 'user',
            'address': 'ул. Мира, д. 8, кв. 34',
            'phone': '+7 (999) 567-89-01'
        }
    ]
    
    created_users = []
    for user_data in users_data:
        user = await UserRepository.create_user(session, user_data)
        created_users.append(user)
        print(f"Создан пользователь: {user.email} ({user.role})")
    
    # Устанавливаем начальные балансы
    print("Устанавливаем начальные балансы пользователям...")
    
    for user in created_users:
        if user.role == 'user':
            # Устанавливаем разные начальные балансы для тестирования
            if user.email == 'user1@example.com':
                user.balance = Decimal('500.0')  # Мало денег для теста недостатка
            elif user.email == 'user2@example.com':
                user.balance = Decimal('2000.0')  # Нормальный баланс
            elif user.email == 'user3@example.com':
                user.balance = Decimal('100.0')  # Очень мало денег
            else:
                user.balance = Decimal('1500.0')  # Стандартный баланс
            print(f"Установлен баланс {user.balance} руб для пользователя {user.email}")
        else:
            # Администраторам тоже можно установить баланс
            user.balance = Decimal('5000.0')
            print(f"Установлен баланс 5000.0 руб для администратора {user.email}")
    
    # Сохраняем изменения балансов
    await session.commit()
    print("Балансы пользователей установлены")
    
    # Создаем тестовые платежи и показания для обычных пользователей
    regular_users = [user for user in created_users if user.role == 'user']
    
    for user in regular_users:
        # Создаем платежи (историю оплаченных)
        for i, service in enumerate(utility_services[:4]):  # Только первые 4 услуги
            payment = Payment(
                user_id=user.id,
                service_id=service.id,
                amount=Decimal(str(150.0 + (i * 50))),
                period=datetime(2024, 1, 1),
                status='completed',
                payment_date=datetime(2024, 1, 5),
                transaction_id=f'txn_{user.id}_{service.id}_jan'
            )
            session.add(payment)
        
        # Создаем показания счетчиков
        for service in utility_services[:4]:  # Только для услуг с счетчиками
            reading = MeterReading(
                user_id=user.id,
                service_id=service.id,
                value=Decimal(str(100.0 + (user.id * 10))),
                reading_date=datetime(2024, 2, 1),
                period=datetime(2024, 2, 1)
            )
            session.add(reading)
    
    await session.commit()
    print("Исторические данные созданы")
    
    # СОЗДАЕМ НЕОПЛАЧЕННЫЕ КВИТАНЦИИ ДЛЯ ТЕСТИРОВАНИЯ
    print("Создаем неоплаченные квитанции для тестирования...")
    
    # Создаем квитанции за разные месяцы
    months = [
        (datetime(2024, 2, 1), "Февраль 2024"),
        (datetime(2024, 3, 1), "Март 2024"),
        (datetime(2024, 4, 1), "Апрель 2024")
    ]
    
    for user in regular_users:
        for period, period_name in months:
            # Создаем квитанции с разными суммами в зависимости от пользователя
            base_amount = Decimal('2500.0')  # Базовая сумма
            
            # Добавляем вариативность в зависимости от пользователя
            if user.email == 'user1@example.com':
                total_amount = base_amount + Decimal('500.0')  # 3000 руб
            elif user.email == 'user2@example.com':
                total_amount = base_amount + Decimal('200.0')  # 2700 руб
            elif user.email == 'user3@example.com':
                total_amount = base_amount - Decimal('300.0')  # 2200 руб
            else:
                total_amount = base_amount  # 2500 руб
            
            # Определяем статус в зависимости от периода
            # За февраль - оплаченные, за март и апрель - неоплаченные
            status = 'paid' if period.month == 2 else 'generated'
            
            receipt = Receipt(
                user_id=user.id,
                total_amount=total_amount,
                period=period,
                generated_date=period + timedelta(days=2),
                status=status
            )
            session.add(receipt)
            print(f"Создана квитанция для {user.email} за {period_name}: {total_amount} руб, статус: {status}")
    
    consumption_patterns = {
        'user1@example.com': {
            'Электроэнергия': 250,  # кВт·ч
            'Водоснабжение': 12.5,  # м³
            'Отопление': 0.8,       # Гкал
            'Газоснабжение': 25,    # м³
            'Вывоз ТБО': 1,         # мес
            'Капитальный ремонт': 45 # м²
        },
        'user2@example.com': {
            'Электроэнергия': 180,
            'Водоснабжение': 8.2,
            'Отопление': 0.6,
            'Газоснабжение': 18,
            'Вывоз ТБО': 1,
            'Капитальный ремонт': 35
        },
        'user3@example.com': {
            'Электроэнергия': 320,
            'Водоснабжение': 15.8,
            'Отопление': 1.1,
            'Газоснабжение': 32,
            'Вывоз ТБО': 1,
            'Капитальный ремонт': 55
        },
        'user4@example.com': {
            'Электроэнергия': 210,
            'Водоснабжение': 10.3,
            'Отопление': 0.7,
            'Газоснабжение': 22,
            'Вывоз ТБО': 1,
            'Капитальный ремонт': 40
        }
    }
    
    for user in regular_users:
        user_pattern = consumption_patterns.get(user.email, consumption_patterns['user1@example.com'])
        
        for period, period_name in months:
            total_amount = Decimal('0.0')
            receipt_items = []
            
            # Создаем элементы квитанции для каждой услуги
            for service in utility_services:
                if service.name in user_pattern:
                    quantity = Decimal(str(user_pattern[service.name]))
                    rate = service.rate
                    amount = quantity * rate
                    total_amount += amount
                    
                    receipt_item_data = {
                        'service_id': service.id,
                        'quantity': quantity,
                        'rate': rate,
                        'amount': amount
                    }
                    receipt_items.append(receipt_item_data)
            
            # Определяем статус
            status = 'paid' if period.month == 2 else 'generated'
            
            # Создаем квитанцию
            receipt = Receipt(
                user_id=user.id,
                total_amount=total_amount,
                period=period,
                generated_date=period + timedelta(days=2),
                status=status
            )
            session.add(receipt)
            await session.flush()  # Получаем ID квитанции
            
            # Создаем элементы квитанции
            for item_data in receipt_items:
                receipt_item = ReceiptItem(
                    receipt_id=receipt.id,
                    service_id=item_data['service_id'],
                    quantity=item_data['quantity'],
                    rate=item_data['rate'],
                    amount=item_data['amount']
                )
                session.add(receipt_item)
            
            print(f"Создана квитанция для {user.email} за {period_name}: {total_amount} руб")
    
    await session.commit()
    print("Квитанции с детальной разбивкой созданы")
    
    # Создаем несколько транзакций баланса для истории
    print("Создаем историю транзакций баланса...")
    
    for user in regular_users:
        # Пополнения баланса
        deposit_transaction = BalanceTransaction(
            user_id=user.id,
            amount=user.balance,  # Исходный баланс как пополнение
            transaction_type='deposit',
            description='Начальное пополнение баланса',
            status='completed',
            transaction_date=datetime(2024, 1, 1)
        )
        session.add(deposit_transaction)
        
        # Небольшое дополнительное пополнение
        extra_deposit = BalanceTransaction(
            user_id=user.id,
            amount=Decimal('500.0'),
            transaction_type='deposit',
            description='Дополнительное пополнение',
            status='completed',
            transaction_date=datetime(2024, 1, 15)
        )
        session.add(extra_deposit)
        
        # Оплата за январь (если баланс позволяет)
        if user.balance > Decimal('1000.0'):
            payment_transaction = BalanceTransaction(
                user_id=user.id,
                amount=Decimal('1200.0'),
                transaction_type='payment',
                description='Оплата коммунальных услуг за Январь 2024',
                status='completed',
                transaction_date=datetime(2024, 1, 20),
                reference_id=f'receipt_jan_{user.id}'
            )
            session.add(payment_transaction)
    
    await session.commit()
    print("История транзакций баланса создана")
    
    print("=" * 50)
    print("НАЧАЛЬНЫЕ ДАННЫЕ УСПЕШНО ДОБАВЛЕНЫ!")
    print("=" * 50)
    print("ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ:")
    for user in created_users:
        if user.role == 'user':
            print(f"- {user.email}: {user.full_name}")
            print(f"  Баланс: {user.balance} руб")
            print(f"  Адрес: {user.address}")
    print("\nДЛЯ ТЕСТИРОВАНИЯ РЕКОМЕНДУЕТСЯ:")
    print("1. user1@example.com - мало средств (500 руб), есть большая квитанция (5500 руб)")
    print("2. user2@example.com - нормальный баланс (2000 руб), есть небольшая квитанция (1800 руб)") 
    print("3. user3@example.com - очень мало средств (100 руб), квитанция превышает баланс (3200 руб)")
    print("4. user4@example.com - стандартный баланс (1500 руб)")
    print("=" * 50)
