'use client';

import { useState } from 'react';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`${activeTab === 'login' ? 'Вход' : 'Регистрация'} данные:`, formData);
    // Здесь будет реализация отправки данных
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
            onClick={() => setActiveTab('login')}
          >
            Вход
          </button>
          <button
            className={`flex-1 py-4 font-semibold transition-all duration-300 ${
              activeTab === 'register'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('register')}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300"
          >
            {activeTab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Дополнительные ссылки */}
        <div className="px-6 pb-6 text-center">
          {activeTab === 'login' ? (
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <button
                onClick={() => setActiveTab('register')}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => setActiveTab('login')}
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
