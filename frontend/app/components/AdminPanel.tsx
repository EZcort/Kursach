// app/components/AdminPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, User, UtilityService, Payment, MeterReading } from '@/app/api/auth';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'services' | 'payments' | 'readings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<UtilityService[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Состояния для формы добавления/редактирования услуги
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<UtilityService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    unit: '',
    rate: 0
  });

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'services') {
      fetchServices();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'readings') {
      fetchReadings();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      // Используем метод для получения всех услуг (включая неактивные)
      const data = await apiClient.getAllUtilityServices();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAllPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAllMeterReadings();
      setReadings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Функции для работы с услугами
  const handleAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      unit: '',
      rate: 0
    });
    setShowServiceForm(true);
  };

  const handleEditService = (service: UtilityService) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      unit: service.unit,
      rate: service.rate
    });
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
      try {
        const result = await apiClient.deleteUtilityService(serviceId);
        
        if (result.message.includes('деактивирована')) {
          // Обновляем список, помечая услугу как неактивную
          setServices(services.map(service => 
            service.id === serviceId ? {...service, is_active: false} : service
          ));
          alert('Услуга деактивирована (есть связанные платежи или показания)');
        } else {
          // Полностью удаляем услугу из списка
          setServices(services.filter(service => service.id !== serviceId));
          alert('Услуга удалена');
        }
      } catch (err: any) {
        console.error('Error deleting service:', err);
        setError(err.message);
      }
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        // Редактирование существующей услуги
        const updatedService = await apiClient.updateUtilityService(editingService.id, serviceForm);
        setServices(services.map(service => 
          service.id === editingService.id ? updatedService : service
        ));
        alert('Услуга обновлена');
      } else {
        // Добавление новой услуги
        const newService = await apiClient.createUtilityService(serviceForm);
        setServices([...services, newService]);
        alert('Услуга добавлена');
      }
      setShowServiceForm(false);
      setEditingService(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting service:', err);
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
    <div className="bg-white rounded-lg shadow-lg">
      {/* Навигация админки */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'users', name: 'Пользователи' },
            { id: 'services', name: 'Услуги' },
            { id: 'payments', name: 'Платежи' },
            { id: 'readings', name: 'Показания' }
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

      {/* Контент админки */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Пользователи */}
            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Управление пользователями</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Услуги */}
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Управление услугами</h3>
                  <button 
                    onClick={handleAddService}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Добавить услугу
                  </button>
                </div>

                {/* Форма добавления/редактирования услуги */}
                {showServiceForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-lg font-semibold mb-3">
                      {editingService ? 'Редактировать услугу' : 'Добавить новую услугу'}
                    </h4>
                    <form onSubmit={handleSubmitService} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Название услуги *
                          </label>
                          <input
                            type="text"
                            value={serviceForm.name}
                            onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Единица измерения *
                          </label>
                          <input
                            type="text"
                            value={serviceForm.unit}
                            onChange={(e) => setServiceForm({...serviceForm, unit: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="кВт·ч, м³, Гкал"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Тариф (руб.) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={serviceForm.rate}
                            onChange={(e) => setServiceForm({...serviceForm, rate: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание
                          </label>
                          <textarea
                            value={serviceForm.description}
                            onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                          {editingService ? 'Сохранить изменения' : 'Добавить услугу'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowServiceForm(false);
                            setEditingService(null);
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Список услуг */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div 
                      key={service.id} 
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        !service.is_active ? 'bg-gray-100 opacity-70' : ''
                      }`}
                    >
                      {!service.is_active && (
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium mb-2 inline-block">
                          Неактивна
                        </div>
                      )}
                      <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(service.rate)}
                        </span>
                        <span className="text-sm text-gray-500">за {service.unit}</span>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button 
                          onClick={() => handleEditService(service)}
                          disabled={!service.is_active}
                          className={`flex-1 py-1 px-3 rounded text-sm ${
                            service.is_active 
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Редактировать
                        </button>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="flex-1 bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Платежи */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Все платежи</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Услуга</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Период</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ID: {payment.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.service?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.period)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Показания */}
            {activeTab === 'readings' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Все показания счетчиков</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Услуга</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Показание</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата подачи</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Период</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {readings.map((reading) => (
                        <tr key={reading.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reading.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ID: {reading.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reading.service?.name}
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
