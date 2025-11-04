# app/routers/balance.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.balance_repo import BalanceRepository
from app.schemas.payments import BalanceDepositSchema, BalanceTransactionResponseSchema, BalanceInfoResponseSchema
from app.routers.Auth import security
from typing import List
from decimal import Decimal

router = APIRouter(prefix='/balance', tags=['Balance'])

@router.get('/my-balance', response_model=BalanceInfoResponseSchema)
async def get_my_balance(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить текущий баланс пользователя"""
    user_id = int(token_payload.sub)
    balance_decimal = await BalanceRepository.get_user_balance(db, user_id)
    
    # Конвертируем Decimal в float для ответа
    return BalanceInfoResponseSchema(
        user_id=user_id,
        balance=float(balance_decimal),
        currency="RUB"
    )

@router.post('/deposit')
async def deposit_balance(
    deposit_data: BalanceDepositSchema,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Пополнить баланс"""
    user_id = int(token_payload.sub)
    
    if deposit_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сумма пополнения должна быть положительной"
        )
    
    try:
        user = await BalanceRepository.deposit_balance(
            db, 
            user_id, 
            deposit_data.amount,  # передаем float, репозиторий конвертирует в Decimal
            deposit_data.description
        )
        
        return {
            "message": "Баланс успешно пополнен",
            "new_balance": float(user.balance),  # Конвертируем Decimal в float
            "deposited_amount": deposit_data.amount
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get('/transactions', response_model=List[BalanceTransactionResponseSchema])
async def get_my_transactions(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить историю транзакций"""
    user_id = int(token_payload.sub)
    transactions = await BalanceRepository.get_user_transactions(db, user_id)
    
    # Конвертируем Decimal в float для каждого объекта
    response_transactions = []
    for transaction in transactions:
        transaction_dict = BalanceTransactionResponseSchema.model_validate(transaction).dict()
        transaction_dict['amount'] = float(transaction.amount)  # Конвертируем Decimal в float
        response_transactions.append(transaction_dict)
    
    return response_transactions
