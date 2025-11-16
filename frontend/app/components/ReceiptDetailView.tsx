// app/components/ReceiptDetailView.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  apiClient, 
  ReceiptDetail, 
  UtilityService, 
  ManualReadingInput, 
  CalculationDetail,
  RateChangeInfo,
  VerificationResult 
} from '@/app/api/auth';

interface ReceiptDetailViewProps {
  receiptId: number;
  onClose?: () => void;
  onVerificationComplete?: () => void;
}

export default function ReceiptDetailView({ receiptId, onClose, onVerificationComplete }: ReceiptDetailViewProps) {
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [services, setServices] = useState<UtilityService[]>([]);
  const [manualReadings, setManualReadings] = useState<ManualReadingInput[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'verification'>('details');

  useEffect(() => {
    fetchReceiptData();
    fetchServices();
  }, [receiptId]);

  useEffect(() => {
    if (receipt && services.length > 0) {
      initializeManualReadings();
    }
  }, [receipt, services]);

  useEffect(() => {
    calculateTotal();
  }, [manualReadings]);

  const fetchReceiptData = async () => {
    try {
      setIsLoading(true);
      const receiptData = await apiClient.getReceiptDetails(receiptId);
      setReceipt(receiptData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await apiClient.getUtilityServices();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const initializeManualReadings = () => {
    if (!receipt) return;
    
    const initialReadings = receipt.receipt_items.map(item => ({
      service_id: item.service_id,
      value: item.quantity // По умолчанию используем оригинальные показания
    }));
    setManualReadings(initialReadings);
  };

  const calculateTotal = () => {
    let total = 0;
    manualReadings.forEach(reading => {
      const service = services.find(s => s.id === reading.service_id);
      if (service && reading.value > 0) {
        total += reading.value * service.rate;
      }
    });
    setCalculatedTotal(total);
  };

  const handleReadingChange = (serviceId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setManualReadings(prev => 
      prev.map(reading => 
        reading.service_id === serviceId 
          ? { ...reading, value: numValue }
          : reading
      )
    );
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      const verificationData = {
        receipt_id: receiptId,
        manual_readings: manualReadings.filter(reading => reading.value > 0),
        calculated_total: calculatedTotal
      };
      
      const result = await apiClient.verifyReceipt(verificationData);
      setVerificationResult(result);
      
      if (result.is_match && onVerificationComplete) {
        setTimeout(() => {
          onVerificationComplete();
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsVerifying(false);
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
                : receipt.status === 'verified'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {receipt.status === 'paid' ? 'Оплачена' : 
               receipt.status === 'verified' ? 'Проверена' : 'Ожидает оплаты'}
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
            onClick={() => setActiveTab('verification')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'verification'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Проверка
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
          </div>
        )}

        {/* Проверка показаний */}
        {activeTab === 'verification' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Проверка показаний счетчиков</h3>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold">Оригинальная сумма: {formatCurrency(receipt.total_amount)}</p>
              <p className="text-sm text-gray-600">Период: {formatDate(receipt.period)}</p>
              <p className="text-sm text-green-600 mt-1">
                ✓ Используются актуальные тарифы
              </p>
            </div>

            {/* Информация об изменении тарифов */}
            {verificationResult?.rate_info?.has_rate_changes && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Изменения тарифов</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Некоторые тарифы изменились с момента создания квитанции:
                </p>
                <div className="space-y-2">
                  {verificationResult.rate_info.rate_changes.map((change: RateChangeInfo, index: number) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{change.service_name}:</span>
                      <span className="ml-2 text-yellow-700">
                        {formatCurrency(change.original_rate)} → {formatCurrency(change.actual_rate)}
                        {change.change_percentage !== 0 && (
                          <span className={`ml-1 ${change.change_percentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ({change.change_percentage > 0 ? '+' : ''}{change.change_percentage.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <h4 className="font-medium">Введите показания счетчиков:</h4>
              {receipt.receipt_items.map((item) => {
                const service = services.find(s => s.id === item.service_id);
                const manualReading = manualReadings.find(r => r.service_id === item.service_id);
                const actualRate = service?.rate || 0;
                const originalRate = item.rate;
                const rateChanged = Math.abs(actualRate - originalRate) > 0.01;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {service?.name}
                      </label>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          <span className="font-medium">Актуальный тариф:</span>{' '}
                          {formatCurrency(actualRate)} за {service?.unit}
                          {rateChanged && (
                            <span className="text-orange-600 ml-1">
                              (был {formatCurrency(originalRate)})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Оригинальное потребление:</span>{' '}
                          {formatNumber(item.quantity)} {service?.unit}
                        </div>
                        {rateChanged && (
                          <div className="text-orange-600 font-medium">
                            ⚠ Тариф изменен
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={manualReading?.value || 0}
                        onChange={(e) => handleReadingChange(item.service_id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите значение"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">
                Рассчитанная сумма: {formatCurrency(calculatedTotal)}
              </p>
              {calculatedTotal > 0 && (
                <p className={`text-sm ${
                  Math.abs(calculatedTotal - receipt.total_amount) < 0.01 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  Разница: {formatCurrency(calculatedTotal - receipt.total_amount)}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                * Расчет выполнен по актуальным тарифам
              </p>
            </div>

            {verificationResult && (
              <div className={`mb-4 p-4 rounded-lg ${
                verificationResult.is_match ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
              }`}>
                <p className={`font-semibold ${
                  verificationResult.is_match ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.is_match ? '✓ Суммы совпадают!' : '✗ Суммы не совпадают'}
                </p>
                
                {/* Детали расчета с актуальными тарифами */}
                {verificationResult.calculation_details && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Детали расчета (по актуальным тарифам):</p>
                    {verificationResult.calculation_details.map((detail: CalculationDetail, index: number) => (
                      <div key={index} className="text-gray-600 mt-1">
                        <span className="font-medium">{detail.service_name}:</span>{' '}
                        {formatNumber(detail.value)} {detail.service_unit} × {formatCurrency(detail.actual_rate)} = {formatCurrency(detail.amount)}
                        {detail.rate_changed && detail.original_rate && (
                          <span className="text-orange-600 text-xs ml-2">
                            (было {formatCurrency(detail.original_rate)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Информация о тарифах */}
                {verificationResult.rate_info?.has_rate_changes && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                    <p className="text-xs text-yellow-700">
                      При расчете использованы актуальные тарифы. Некоторые тарифы изменились с момента создания квитанции.
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={isVerifying || calculatedTotal === 0}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {isVerifying ? 'Проверка...' : 'Проверить квитанцию'}
            </button>
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
