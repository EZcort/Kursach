// app/components/ReceiptPayment.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, Receipt, ReceiptDetail } from '@/app/api/auth';
import ReceiptDetailView from './ReceiptDetailView';

interface ReceiptPaymentProps {
  receipts: Receipt[];
  onPaymentSuccess?: () => void;
}

export default function ReceiptPayment({ receipts, onPaymentSuccess }: ReceiptPaymentProps) {
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptsWithDetails, setReceiptsWithDetails] = useState<ReceiptDetail[]>([]);

  useEffect(() => {
    fetchUserBalance();
    fetchReceiptsWithDetails();
  }, [receipts]);

  const fetchUserBalance = async () => {
    try {
      const balanceInfo = await apiClient.getMyBalance();
      setUserBalance(balanceInfo.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const fetchReceiptsWithDetails = async () => {
    try {
      // Загружаем детальную информацию для каждой квитанции
      const detailedReceipts = await Promise.all(
        receipts.map(async (receipt) => {
          try {
            return await apiClient.getReceiptDetails(receipt.id);
          } catch (error) {
            console.error(`Error fetching details for receipt ${receipt.id}:`, error);
            // Возвращаем базовую квитанцию если детали не загрузились
            return {
              ...receipt,
              receipt_items: []
            } as ReceiptDetail;
          }
        })
      );
      setReceiptsWithDetails(detailedReceipts);
    } catch (err) {
      console.error('Error fetching receipts details:', err);
      // Если не удалось загрузить детали, используем базовые квитанции
      setReceiptsWithDetails(receipts.map(receipt => ({
        ...receipt,
        receipt_items: []
      } as ReceiptDetail)));
    }
  };

  const handlePayReceipt = async (receipt: Receipt) => {
    if (receipt.status === 'paid') {
      setError('Эта квитанция уже оплачена');
      return;
    }

    if (userBalance < receipt.total_amount) {
      setError(`Недостаточно средств на балансе. Требуется: ${formatCurrency(receipt.total_amount)}, доступно: ${formatCurrency(userBalance)}`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Оплачиваем квитанцию через баланс
      await apiClient.payReceipt(receipt.id);

      setSuccessMessage(`Квитанция за ${formatDate(receipt.period)} успешно оплачена!`);
      
      // Обновляем баланс
      await fetchUserBalance();
      
      // Уведомляем родительский компонент для полного обновления данных
      if (onPaymentSuccess) {
        setTimeout(() => {
          onPaymentSuccess();
        }, 1000);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Фильтруем только неоплаченные квитанции
  const unpaidReceipts = receiptsWithDetails.filter(receipt => receipt.status !== 'paid');

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Оплата квитанций</h3>

      {/* Информация о балансе */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600">Доступный баланс</p>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(userBalance)}</p>
          </div>
          {userBalance < 1000 && (
            <p className="text-sm text-orange-600">
              Рекомендуется пополнить баланс
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Список квитанций для оплаты */}
      {unpaidReceipts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Нет неоплаченных квитанций
        </div>
      ) : (
        <div className="space-y-4">
          {unpaidReceipts.map((receipt) => (
            <div key={receipt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-semibold text-lg">
                    Квитанция за {formatDate(receipt.period)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Сгенерирована: {formatDate(receipt.generated_date)}
                  </p>
                  {/* Показываем информацию о деталях расчета */}
                  {receipt.receipt_items && receipt.receipt_items.length > 0 ? (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Детали расчета загружены ({receipt.receipt_items.length} услуг)
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-600 mt-1">
                      ⚠ Детали расчета не загружены
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(receipt.total_amount)}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Ожидает оплаты
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {userBalance >= receipt.total_amount ? (
                    <span className="text-green-600">✅ Достаточно средств</span>
                  ) : (
                    <span className="text-red-600">❌ Недостаточно средств</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedReceipt(receipt)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Подробнее
                  </button>
                  <button
                    onClick={() => handlePayReceipt(receipt)}
                    disabled={isLoading || userBalance < receipt.total_amount || receipt.status === 'paid'}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Оплата...' : 'Оплатить'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Оплаченные квитанции */}
      {receiptsWithDetails.filter(r => r.status === 'paid').length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold mb-3 text-gray-700">Оплаченные квитанции</h4>
          <div className="space-y-2">
            {receiptsWithDetails
              .filter(receipt => receipt.status === 'paid')
              .map((receipt) => (
                <div key={receipt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Квитанция за {formatDate(receipt.period)}
                    </span>
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Подробнее
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">
                      {formatCurrency(receipt.total_amount)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Оплачена
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Модальное окно с деталями квитанции */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ReceiptDetailView 
              receiptId={selectedReceipt.id} 
              onClose={() => setSelectedReceipt(null)}
              onVerificationComplete={() => {
                setSelectedReceipt(null);
                if (onPaymentSuccess) {
                  onPaymentSuccess();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
