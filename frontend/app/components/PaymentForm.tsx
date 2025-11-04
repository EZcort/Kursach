// app/components/PaymentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, Receipt } from '@/app/api/auth';
import ReceiptDetailView from './ReceiptDetailView'; // Переименовал компонент

interface PaymentFormProps {
  receipts: Receipt[];
  onPaymentSuccess?: () => void;
}

export default function PaymentForm({ receipts, onPaymentSuccess }: PaymentFormProps) {
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const balanceInfo = await apiClient.getMyBalance();
      setUserBalance(balanceInfo.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
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

      // Создаем платеж для квитанции
      const paymentData = {
        service_id: 1, // ID основной услуги
        amount: receipt.total_amount,
        period: receipt.period
      };

      // 1. Создаем платеж
      const paymentResponse = await apiClient.createPayment(paymentData);
      
      // 2. Оплачиваем через баланс (автоматически обновит статус квитанции на бэкенде)
      await apiClient.payWithBalance(paymentResponse.payment_id);

      setSuccessMessage(`Квитанция за ${formatDate(receipt.period)} успешно оплачена!`);
      
      // 3. Обновляем баланс
      await fetchUserBalance();
      
      // 4. Уведомляем родительский компонент для полного обновления данных
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
  const unpaidReceipts = receipts.filter(receipt => receipt.status !== 'paid');

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
      {receipts.filter(r => r.status === 'paid').length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold mb-3 text-gray-700">Оплаченные квитанции</h4>
          <div className="space-y-2">
            {receipts
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
