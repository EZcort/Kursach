// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import { apiClient } from './api/auth';

export default function Home() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('Checking authentication...');
      await apiClient.getCurrentUser();
      
      // Если авторизован - редирект на главную
      console.log('User is authenticated, redirecting to dashboard');
      window.location.href = '/dashboard';
    } catch (error) {
      // Если не авторизован - показываем форму входа
      console.log('User is not authenticated, showing auth form');
      setAuthChecked(true);
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Показываем форму только после завершения проверки
  return authChecked ? <AuthForm /> : null;
}
