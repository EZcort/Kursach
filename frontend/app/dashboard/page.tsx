// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient, User, UtilityService, Payment, MeterReading, Receipt } from '@/app/api/auth';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminPanel from '../components/AdminPanel';

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'meter-readings' | 'receipts' | 'admin'>('profile');
  
  // Данные ЖКХ
  const [services, setServices] = useState<UtilityService[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'payments') {
        fetchPayments();
        fetchServices();
      } else if (activeTab === 'meter-readings') {
        fetchReadings();
        fetchServices();
      } else if (activeTab === 'receipts') {
        fetchReceipts();
      }
    }
  }, [activeTab, user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching user data...');
      const userData = await apiClient.getCurrentUser();
      console.log('User data received:', userData);
      setUser(userData);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Ошибка загрузки данных пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const servicesData = await apiClient.getUtilityServices();
      setServices(servicesData);
    } catch (err: any) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const paymentsData = await apiClient.getMyPayments();
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
    }
  };

  const fetchReadings = async () => {
    try {
      const readingsData = await apiClient.getMyMeterReadings();
      setReadings(readingsData);
    } catch (err: any) {
      console.error('Error fetching readings:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const receiptsData = await apiClient.getMyReceipts();
      setReceipts(receiptsData);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      
      // Сразу устанавливаем состояние загрузки и очищаем данные
      setIsLoading(true);
      setUser(null);
      
      await apiClient.logout();
      console.log('Logout successful');
      
      // Немедленный редирект без дополнительных проверок
      window.location.href = '/';
      
    } catch (err: any) {
      console.error('Error during logout:', err);
      // Все равно редиректим на страницу входа
      window.location.href = '/';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Система оплаты ЖКХ</h1>
              <p className="text-sm text-gray-600">
                {user && apiClient.isAdmin(user) ? 'Панель администратора' : 'Управление коммунальными услугами'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.full_name} 
                {user && apiClient.isAdmin(user) && (
                  <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    Админ
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', name: 'Профиль' },
              { id: 'payments', name: 'Платежи' },
              { id: 'meter-readings', name: 'Показания' },
              { id: 'receipts', name: 'Квитанции' },
              ...(user && apiClient.isAdmin(user) ? [{ id: 'admin', name: 'Админ-панель' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка данных...</p>
            </div>
          ) : (
            <>
              {/* Админ-панель */}
              {activeTab === 'admin' && user && apiClient.isAdmin(user) && (
                <AdminPanel />
              )}
              
              {/* Профиль */}
              {activeTab === 'profile' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Профиль пользователя
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Основная информация о вашем аккаунте
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Полное имя</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {user?.full_name || 'Не указано'}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {user?.email}
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Роль</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
                          </span>
                        </dd>
                      </div>
                      {user?.address && (
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Адрес</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {user.address}
                          </dd>
                        </div>
                      )}
                      {user?.phone && (
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {user.phone}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}

              {/* Платежи */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        История платежей
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Все ваши платежи за коммунальные услуги
                      </p>
                    </div>
                    <div className="border-t border-gray-200">
                      {payments.length === 0 ? (
                        <div className="px-4 py-5 text-center text-gray-500">
                          Нет данных о платежах
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Услуга
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Сумма
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Период
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Статус
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {payments.map((payment) => (
                                <tr key={payment.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {payment.service?.name || 'Услуга'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(payment.amount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(payment.period)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      payment.status === 'completed' 
                                        ? 'bg-green-100 text-green-800'
                                        : payment.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {payment.status === 'completed' ? 'Оплачен' : 
                                       payment.status === 'pending' ? 'Ожидает' : 'Ошибка'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Услуги */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Коммунальные услуги
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Доступные услуги и тарифы
                      </p>
                    </div>
                    <div className="border-t border-gray-200">
                      {services.length === 0 ? (
                        <div className="px-4 py-5 text-center text-gray-500">
                          Нет данных об услугах
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                          {services.map((service) => (
                            <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                              <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(service.rate)}
                                </span>
                                <span className="text-sm text-gray-500">за {service.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Показания счетчиков */}
              {activeTab === 'meter-readings' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Показания счетчиков
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      История переданных показаний
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    {readings.length === 0 ? (
                      <div className="px-4 py-5 text-center text-gray-500">
                        Нет данных о показаниях
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Услуга
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Показание
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Дата подачи
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Период
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {readings.map((reading) => (
                              <tr key={reading.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {reading.service?.name || 'Услуга'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {reading.value} {reading.service?.unit}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(reading.reading_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(reading.period)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Квитанции */}
              {activeTab === 'receipts' && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Квитанции
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Счета за коммунальные услуги
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    {receipts.length === 0 ? (
                      <div className="px-4 py-5 text-center text-gray-500">
                        Нет данных о квитанциях
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Период
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Сумма
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Дата генерации
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Статус
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {receipts.map((receipt) => (
                              <tr key={receipt.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatDate(receipt.period)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(receipt.total_amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(receipt.generated_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    receipt.status === 'paid' 
                                      ? 'bg-green-100 text-green-800'
                                      : receipt.status === 'generated'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {receipt.status === 'paid' ? 'Оплачена' : 
                                     receipt.status === 'generated' ? 'Сгенерирована' : 'Отправлена'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
