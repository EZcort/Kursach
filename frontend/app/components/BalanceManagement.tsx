// app/components/BalanceManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, BalanceInfo, BalanceTransaction, BalanceDepositData } from '@/app/api/auth';

interface BalanceManagementProps {
  onBalanceUpdate?: () => void;
}

export default function BalanceManagement({ onBalanceUpdate }: BalanceManagementProps) {
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      setIsLoading(true);
      const [balanceData, transactionsData] = await Promise.all([
        apiClient.getMyBalance(),
        apiClient.getBalanceTransactions()
      ]);
      setBalanceInfo(balanceData);
      setTransactions(transactionsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(depositAmount);
    if (amount <= 0 || isNaN(amount)) {
      setError('Введите корректную сумму');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const depositData: BalanceDepositData = {
        amount: amount,
        description: depositDescription || `Пополнение баланса на ${amount} руб.`
      };

      await apiClient.depositBalance(depositData);
      
      // Обновляем данные
      await fetchBalanceData();
      
      // Сбрасываем форму
      setDepositAmount('');
      setDepositDescription('');
      setShowDepositForm(false);
      
      // Уведомляем родительский компонент
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
      
      alert(`Баланс успешно пополнен на ${amount} руб.`);
      
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return 'Пополнение';
      case 'payment': return 'Оплата';
      case 'refund': return 'Возврат';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-600 bg-green-100';
      case 'payment': return 'text-red-600 bg-red-100';
      case 'refund': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Информация о балансе */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Баланс</h3>
          <button
            onClick={() => setShowDepositForm(!showDepositForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Пополнить баланс
          </button>
        </div>

        {balanceInfo && (
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(balanceInfo.balance)}
            </div>
            <p className="text-sm text-gray-600">Текущий баланс</p>
          </div>
        )}

        {/* Форма пополнения баланса */}
        {showDepositForm && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Пополнение баланса</h4>
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма пополнения (руб.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="100000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите сумму"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (необязательно)
                </label>
                <input
                  type="text"
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Пополнение через банковскую карту"
                  maxLength={500}
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300 transition-colors"
                >
                  {isLoading ? 'Пополнение...' : 'Пополнить'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* История транзакций */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">История операций</h3>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Нет операций по балансу
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {getTransactionTypeText(transaction.transaction_type)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {transaction.description}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(transaction.transaction_date)}
                    {transaction.reference_id && ` • ID: ${transaction.reference_id}`}
                  </div>
                </div>
                <div className={`text-lg font-semibold ${
                  transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
