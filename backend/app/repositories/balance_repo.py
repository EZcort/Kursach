# app/repositories/balance_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.users import Users
from app.models.payments import BalanceTransaction
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class BalanceRepository:
    
    @staticmethod
    async def get_user_balance(session: AsyncSession, user_id: int) -> Decimal:
        """Получить текущий баланс пользователя"""
        result = await session.execute(
            select(Users.balance).where(Users.id == user_id)
        )
        balance = result.scalar_one_or_none()
        return balance or Decimal('0.0')
    
    @staticmethod
    async def deposit_balance(
        session: AsyncSession, 
        user_id: int, 
        amount: float, 
        description: str = "Пополнение баланса"
    ) -> Users:
        """Пополнить баланс пользователя"""
        user = await session.get(Users, user_id)
        if not user:
            raise ValueError("Пользователь не найден")
        
        # Конвертируем float в Decimal для корректной операции
        amount_decimal = Decimal(str(amount))
        user.balance += amount_decimal
        
        # Создаем запись о транзакции
        transaction = BalanceTransaction(
            user_id=user_id,
            amount=amount_decimal,
            transaction_type='deposit',
            description=description,
            status='completed'
        )
        session.add(transaction)
        
        await session.commit()
        await session.refresh(user)
        return user
    
    @staticmethod
    async def withdraw_balance(
        session: AsyncSession,
        user_id: int,
        amount: float,
        description: str = "Оплата услуг",
        reference_id: str = None
    ) -> Users:
        """Списать средства с баланса"""
        user = await session.get(Users, user_id)
        if not user:
            raise ValueError("Пользователь не найден")
        
        # Конвертируем float в Decimal
        amount_decimal = Decimal(str(amount))
        
        if user.balance < amount_decimal:
            raise ValueError("Недостаточно средств на балансе")
        
        user.balance -= amount_decimal
        
        # Создаем запись о транзакции
        transaction = BalanceTransaction(
            user_id=user_id,
            amount=amount_decimal,
            transaction_type='payment',
            description=description,
            status='completed',
            reference_id=reference_id
        )
        session.add(transaction)
        
        await session.commit()
        await session.refresh(user)
        return user
    
    @staticmethod
    async def get_user_transactions(
        session: AsyncSession, 
        user_id: int, 
        limit: int = 50
    ) -> List[BalanceTransaction]:
        """Получить историю транзакций пользователя"""
        result = await session.execute(
            select(BalanceTransaction)
            .where(BalanceTransaction.user_id == user_id)
            .order_by(BalanceTransaction.transaction_date.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def create_transaction(
        session: AsyncSession,
        user_id: int,
        amount: float,
        transaction_type: str,
        description: str = None,
        status: str = 'completed',
        reference_id: str = None
    ) -> BalanceTransaction:
        """Создать запись о транзакции"""
        # Конвертируем float в Decimal
        amount_decimal = Decimal(str(amount))
        
        transaction = BalanceTransaction(
            user_id=user_id,
            amount=amount_decimal,
            transaction_type=transaction_type,
            description=description,
            status=status,
            reference_id=reference_id
        )
        session.add(transaction)
        await session.commit()
        await session.refresh(transaction)
        return transaction
