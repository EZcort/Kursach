// app/components/ReceiptDetailView.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, ReceiptDetail, ReceiptComparison, ConsumptionChange } from '@/app/api/auth';

interface ReceiptDetailViewProps {
  receiptId: number;
  onClose?: () => void;
}

export default function ReceiptDetailView({ receiptId, onClose }: ReceiptDetailViewProps) {
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [comparison, setComparison] = useState<ReceiptComparison | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comparison'>('details');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceiptData();
  }, [receiptId]);

  const fetchReceiptData = async () => {
    try {
      setIsLoading(true);
      const [receiptData, comparisonData] = await Promise.all([
        apiClient.getReceiptDetails(receiptId),
        apiClient.compareReceipts(receiptId)
      ]);
      setReceipt(receiptData);
      setComparison(comparisonData);
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

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка квитанции...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-red-600">
          <p>Ошибка загрузки квитанции: {error}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Заголовок */}
      <div className="border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Квитанция за {formatDate(receipt.period)}
            </h2>
            <p className="text-sm text-gray-600">
              Сгенерирована: {formatDate(receipt.generated_date)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(receipt.total_amount)}
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              receipt.status === 'paid' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {receipt.status === 'paid' ? 'Оплачена' : 'Ожидает оплаты'}
            </span>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Детали расчета
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Сравнение
          </button>
        </nav>
      </div>

      {/* Контент */}
      <div className="p-6">
        {/* Детали расчета */}
        {activeTab === 'details' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Расчет стоимости</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Услуга
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Потребление
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Тариф
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipt.receipt_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.service?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.quantity)} {item.service?.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                      Итого:
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {formatCurrency(receipt.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Дополнительная информация */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Период:</strong> {formatDate(receipt.period)}
              </div>
              <div>
                <strong>Дата генерации:</strong> {formatDate(receipt.generated_date)}
              </div>
              <div>
                <strong>Статус:</strong> 
                <span className={`ml-2 ${
                  receipt.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {receipt.status === 'paid' ? 'Оплачена' : 'Ожидает оплаты'}
                </span>
              </div>
              <div>
                <strong>Количество услуг:</strong> {receipt.receipt_items.length}
              </div>
            </div>
          </div>
        )}

        {/* Сравнение */}
        {activeTab === 'comparison' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Сравнение с предыдущим периодом
              {comparison?.previous_receipt && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({formatDate(comparison.previous_receipt.period)})
                </span>
              )}
            </h3>

            {!comparison?.previous_receipt ? (
              <div className="text-center py-8 text-gray-500">
                Нет данных для сравнения
                <p className="text-sm mt-2">Это первая квитанция или данные за предыдущий период отсутствуют</p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Услуга
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Текущее потребление
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Предыдущее потребление
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Изменение
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Влияние на сумму
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(comparison.consumption_changes).map(([serviceName, change]) => (
                        <tr key={serviceName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {serviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(change.current_quantity)} 
                            {receipt.receipt_items.find(item => item.service?.name === serviceName)?.service?.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(change.previous_quantity)}
                            {receipt.receipt_items.find(item => item.service?.name === serviceName)?.service?.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${getChangeColor(change.quantity_change)}`}>
                              {getChangeIcon(change.quantity_change)} {formatNumber(Math.abs(change.quantity_change))}
                              {change.change_percentage !== 0 && (
                                <span className="text-xs ml-1">
                                  ({change.change_percentage > 0 ? '+' : ''}{formatNumber(change.change_percentage, 1)}%)
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${getChangeColor(change.amount_change)}`}>
                              {getChangeIcon(change.amount_change)} {formatCurrency(Math.abs(change.amount_change))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Сводка изменений */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Сводка изменений</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Общее изменение суммы:</span>
                      <span className={`ml-2 font-semibold ${
                        receipt.total_amount - comparison.previous_receipt.total_amount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(receipt.total_amount - comparison.previous_receipt.total_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Текущий период:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(receipt.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Предыдущий период:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(comparison.previous_receipt.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кнопка закрытия */}
      <div className="border-t px-6 py-4">
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
