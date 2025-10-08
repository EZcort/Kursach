// AuthForm.tsx
'use client';

import { useState } from 'react';
import { apiClient, LoginData, RegisterData } from '@/app/lib/api';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибку при изменении поля
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Email и пароль обязательны для заполнения');
      return false;
    }

    if (activeTab === 'register') {
      if (!formData.name) {
        setError('Имя обязательно для заполнения');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password
        };
        const response = await apiClient.login(loginData);
        console.log('Вход успешен:', response);
        
        // Редирект или обновление состояния приложения
        window.location.href = '/dashboard'; // или используйте роутер
      } else {
        const registerData: RegisterData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.name || ''
        };
        const response = await apiClient.register(registerData);
        console.log('Регистрация успешна:', response);
        
        // Автоматический вход после регистрации или переход на страницу входа
        setActiveTab('login');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        alert('Регистрация успешна! Теперь вы можете войти в систему.');
      }
    } catch (err: any) {
      console.error('Ошибка авторизации:', err);
      setError(err.message || 'Произошла ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        {/* Переключатель вкладок */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 font-semibold transition-all duration-300 ${
              activeTab === 'login'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
          >
            Вход
          </button>
          <button
            className={`flex-1 py-4 font-semibold transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите ваше имя"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@mail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите пароль"
              required
            />
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите пароль
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Повторите пароль"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-300"
          >
            {isLoading ? 'Загрузка...' : activeTab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Дополнительные ссылки */}
        <div className="px-6 pb-6 text-center">
          {activeTab === 'login' ? (
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <button
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                Войти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
