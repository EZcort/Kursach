# app/repositories/receipt_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.payments import Receipt, ReceiptItem
from typing import List, Optional, Dict
from datetime import datetime
from decimal import Decimal

class ReceiptRepository:
    
    @staticmethod
    async def get_receipt_with_details(session: AsyncSession, receipt_id: int) -> Optional[Receipt]:
        """Получить квитанцию с детальной разбивкой"""
        result = await session.execute(
            select(Receipt)
            .options(
                selectinload(Receipt.receipt_items)
                .selectinload(ReceiptItem.service)
            )
            .where(Receipt.id == receipt_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_receipts_with_details(session: AsyncSession, user_id: int) -> List[Receipt]:
        """Получить все квитанции пользователя с деталями"""
        result = await session.execute(
            select(Receipt)
            .options(
                selectinload(Receipt.receipt_items)
                .selectinload(ReceiptItem.service)
            )
            .where(Receipt.user_id == user_id)
            .order_by(Receipt.period.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_previous_receipt(session: AsyncSession, user_id: int, current_period: datetime) -> Optional[Receipt]:
        """Получить предыдущую квитанцию для сравнения"""
        result = await session.execute(
            select(Receipt)
            .options(
                selectinload(Receipt.receipt_items)
                .selectinload(ReceiptItem.service)
            )
            .where(
                Receipt.user_id == user_id,
                Receipt.period < current_period
            )
            .order_by(Receipt.period.desc())
        )
        return result.scalars().first()
    
    @staticmethod
    async def compare_receipts(session: AsyncSession, receipt_id: int) -> Dict:
        """Сравнить квитанцию с предыдущей"""
        current_receipt = await ReceiptRepository.get_receipt_with_details(session, receipt_id)
        if not current_receipt:
            return {}
        
        previous_receipt = await ReceiptRepository.get_previous_receipt(
            session, current_receipt.user_id, current_receipt.period
        )
        
        comparison_data = {
            'current_receipt': current_receipt,
            'previous_receipt': previous_receipt,
            'consumption_changes': {}
        }
        
        if previous_receipt:
            # Сравниваем потребление по услугам
            current_items = {item.service.name: item for item in current_receipt.receipt_items}
            previous_items = {item.service.name: item for item in previous_receipt.receipt_items}
            
            for service_name, current_item in current_items.items():
                if service_name in previous_items:
                    previous_item = previous_items[service_name]
                    
                    quantity_change = float(current_item.quantity) - float(previous_item.quantity)
                    amount_change = float(current_item.amount) - float(previous_item.amount)
                    change_percentage = (quantity_change / float(previous_item.quantity)) * 100 if float(previous_item.quantity) > 0 else 0
                    
                    comparison_data['consumption_changes'][service_name] = {
                        'quantity_change': quantity_change,
                        'amount_change': amount_change,
                        'change_percentage': change_percentage,
                        'current_quantity': float(current_item.quantity),
                        'previous_quantity': float(previous_item.quantity)
                    }
        
        return comparison_data
