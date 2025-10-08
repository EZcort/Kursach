// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

// Динамическое определение URL
const getApiBaseUrl = () => {
  // Всегда используем публичный URL на клиенте
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('API Request:', url); // Для отладки
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Для работы с cookies
      ...options,
    });

    if (!response.ok) {
      let errorDetail = 'Request failed';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    // Для пустых ответов (например, logout)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    return this.request('/Authorization/login-cookie', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async register(registerData: RegisterData): Promise<any> {
    return this.request('/Authorization/register', {
      method: 'POST',
      body: JSON.stringify({
        ...registerData,
        role: registerData.role || 'user'
      }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/Authorization/me');
  }

  async logout(): Promise<any> {
    return this.request('/Authorization/logout', {
      method: 'POST',
    });
  }
}

// Создаем инстанс с правильным URL
export const apiClient = new ApiClient();
