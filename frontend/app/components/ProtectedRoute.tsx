// app/components/ProtectedRoute.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient, User } from '@/app/api/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('ProtectedRoute: Checking auth...');
      const user = await apiClient.getCurrentUser();
      console.log('ProtectedRoute: User is authenticated:', user);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.log('ProtectedRoute: User is not authenticated:', error.message);
      setIsAuthenticated(false);
      
      // Редирект только если это не ошибка сети/сервера
      if (!error.message.includes('Failed to fetch') && !error.message.includes('Network')) {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        // Если ошибка сети, все равно показываем контент или ошибку
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 text-center mb-6">
            У вас нет доступа к этой странице. Перенаправление на страницу входа...
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Перейти к входу
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
