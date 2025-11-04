# app/routers/receipts.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.receipt_repo import ReceiptRepository
from app.schemas.payments import ReceiptDetailResponseSchema, ReceiptComparisonSchema
from app.routers.Auth import security
from typing import List

router = APIRouter(prefix='/receipts', tags=['Receipts'])

@router.get('/{receipt_id}', response_model=ReceiptDetailResponseSchema)
async def get_receipt_details(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить детальную информацию о квитанции"""
    user_id = int(token_payload.sub)
    
    receipt = await ReceiptRepository.get_receipt_with_details(db, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Квитанция не найдена")
    
    # Проверяем доступ
    if receipt.user_id != user_id and token_payload.role != 'admin':
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return ReceiptDetailResponseSchema.model_validate(receipt)

@router.get('/{receipt_id}/compare', response_model=ReceiptComparisonSchema)
async def compare_receipts(
    receipt_id: int,
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Сравнить квитанцию с предыдущей"""
    user_id = int(token_payload.sub)
    
    # Проверяем доступ к квитанции
    receipt = await ReceiptRepository.get_receipt_with_details(db, receipt_id)
    if not receipt or (receipt.user_id != user_id and token_payload.role != 'admin'):
        raise HTTPException(status_code=404, detail="Квитанция не найдена")
    
    comparison_data = await ReceiptRepository.compare_receipts(db, receipt_id)
    
    return ReceiptComparisonSchema(**comparison_data)

@router.get('/user/my-receipts-detailed', response_model=List[ReceiptDetailResponseSchema])
async def get_my_receipts_detailed(
    db: AsyncSession = Depends(get_db),
    token_payload = Depends(security.access_token_required)
):
    """Получить все квитанции пользователя с деталями"""
    user_id = int(token_payload.sub)
    
    receipts = await ReceiptRepository.get_user_receipts_with_details(db, user_id)
    return [ReceiptDetailResponseSchema.model_validate(receipt) for receipt in receipts]
