// app/components/ReceiptVerification.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, Receipt, UtilityService, ManualReadingInput } from '@/app/api/auth';

interface ReceiptVerificationProps {
  receipt: Receipt;
  onVerificationComplete: () => void;
}

export default function ReceiptVerification({ receipt, onVerificationComplete }: ReceiptVerificationProps) {
  const [services, setServices] = useState<UtilityService[]>([]);
  const [manualReadings, setManualReadings] = useState<ManualReadingInput[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [manualReadings]);

  const fetchServices = async () => {
    try {
      const data = await apiClient.getUtilityServices();
      setServices(data);
      // Инициализируем ручные показания
      const initialReadings = data.map(service => ({
        service_id: service.id,
        value: 0
      }));
      setManualReadings(initialReadings);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
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
      setIsLoading(true);
      const verificationData = {
        receipt_id: receipt.id,
        manual_readings: manualReadings.filter(reading => reading.value > 0),
        calculated_total: calculatedTotal
      };
      
      const result = await apiClient.verifyReceipt(verificationData);
      setResult(result);
      
      if (result.is_match) {
        onVerificationComplete();
      }
    } catch (error: any) {
      console.error('Error verifying receipt:', error);
      alert('Ошибка при проверке квитанции: ' + error.message);
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Проверка квитанции</h3>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="font-semibold">Оригинальная сумма: {formatCurrency(receipt.total_amount)}</p>
        <p className="text-sm text-gray-600">Период: {new Date(receipt.period).toLocaleDateString('ru-RU')}</p>
      </div>

      <div className="space-y-4 mb-6">
        <h4 className="font-medium">Введите показания счетчиков:</h4>
        {services.map(service => (
          <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {service.name}
              </label>
              <p className="text-xs text-gray-500">
                Тариф: {formatCurrency(service.rate)} за {service.unit}
              </p>
            </div>
            <div className="w-32">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                onChange={(e) => handleReadingChange(service.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
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
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-lg ${
          result.is_match ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
        }`}>
          <p className={`font-semibold ${
            result.is_match ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.is_match ? '✓ Суммы совпадают!' : '✗ Суммы не совпадают'}
          </p>
          {result.calculation_details && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Детали расчета:</p>
              {result.calculation_details.map((detail: any, index: number) => (
                <p key={index} className="text-gray-600">
                  {services.find(s => s.id === detail.service_id)?.name}: {detail.value} × {formatCurrency(detail.rate)} = {formatCurrency(detail.amount)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={isLoading || calculatedTotal === 0}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
      >
        {isLoading ? 'Проверка...' : 'Проверить квитанцию'}
      </button>
    </div>
  );
}
