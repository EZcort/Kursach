// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient, User, UtilityService, Receipt } from '@/app/api/auth';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminPanel from '../components/AdminPanel';
import BalanceManagement from '../components/BalanceManagement';
import ReceiptPayment from '../components/ReceiptPayment';
import ReceiptDetailView from '../components/ReceiptDetailView';

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'balance' | 'receipts' | 'admin'>('profile');
  
  // Данные ЖКХ
  const [services, setServices] = useState<UtilityService[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  
  // Состояние для детального просмотра квитанции
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      // Загружаем услуги при первой загрузке пользователя
      if (services.length === 0) {
        fetchServices();
      }
      
      if (activeTab === 'receipts') {
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
      console.log('Fetching services...');
      const servicesData = await apiClient.getUtilityServices();
      console.log('Services data received:', servicesData);
      setServices(servicesData);
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError('Ошибка загрузки тарифов');
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
              { id: 'balance', name: 'Баланс' },
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
                <div className="space-y-6">
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

                  {/* Тарифы в профиле */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Коммунальные услуги и тарифы
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Актуальные тарифы на коммунальные услуги
                      </p>
                    </div>
                    <div className="border-t border-gray-200">
                      {services.length === 0 ? (
                        <div className="px-4 py-5 text-center text-gray-500">
                          Загрузка тарифов...
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

              {/* Баланс */}
              {activeTab === 'balance' && (
                <BalanceManagement onBalanceUpdate={fetchUserData} />
              )}

              {/* Квитанции */}
              {activeTab === 'receipts' && (
                <ReceiptPayment 
                  receipts={receipts} 
                  onPaymentSuccess={() => {
                    fetchReceipts();
                    fetchUserData();
                  }} 
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Модальное окно с деталями квитанции и проверкой */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ReceiptDetailView 
              receiptId={selectedReceipt.id} 
              onClose={() => setSelectedReceipt(null)}
              onVerificationComplete={() => {
                setSelectedReceipt(null);
                fetchReceipts(); // Обновляем список квитанций
              }}
            />
          </div>
        </div>
      )}
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
