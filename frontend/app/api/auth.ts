// app/api/auth.ts
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
  address?: string;
  phone?: string;
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
  address?: string;
  phone?: string;
  balance: number; // Добавляем баланс
}

// Новые интерфейсы для баланса
export interface BalanceInfo {
  user_id: number;
  balance: number;
  currency: string;
}

export interface BalanceDepositData {
  amount: number;
  description?: string;
}

export interface BalanceTransaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  description?: string;
  status: string;
  transaction_date: string;
  reference_id?: string;
}

export interface ReceiptItem {
  id: number;
  receipt_id: number;
  service_id: number;
  quantity: number;
  rate: number;
  amount: number;
  service?: UtilityService;
}

export interface ReceiptDetail {
  id: number;
  user_id: number;
  total_amount: number;
  period: string;
  generated_date: string;
  status: string;
  receipt_items: ReceiptItem[];
}

export interface ConsumptionChange {
  quantity_change: number;
  amount_change: number;
  change_percentage: number;
  current_quantity: number;
  previous_quantity: number;
}

export interface ReceiptComparison {
  current_receipt: ReceiptDetail;
  previous_receipt?: ReceiptDetail;
  consumption_changes: { [serviceName: string]: ConsumptionChange };
}

// Новые интерфейсы для ЖКХ
export interface UtilityService {
  id: number;
  name: string;
  description: string;
  unit: string;
  rate: number;
  is_active: boolean;
}

export interface MeterReading {
  id: number;
  user_id: number;
  service_id: number;
  value: number;
  reading_date: string;
  period: string;
  service?: UtilityService;
}

export interface Payment {
  id: number;
  user_id: number;
  service_id: number;
  amount: number;
  status: string;
  period: string;
  payment_date?: string;
  transaction_id?: string;
  service?: UtilityService;
}

export interface Receipt {
  id: number;
  user_id: number;
  total_amount: number;
  period: string;
  generated_date: string;
  status: string;
}

export interface MeterReadingCreateData {
  service_id: number;
  value: number;
  period: string;
}

export interface PaymentCreateData {
  service_id: number;
  amount: number;
  period: string;
}

export interface PaymentProcessingData {
  payment_id: number;
  card_number: string;
  expiry_date: string;
  cvv: string;
}

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('API Request:', url, options);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });

    console.log('API Response:', response.status, response.statusText);

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

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Аутентификация
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
    return this.request('/Authorization/me', {
      method: 'GET',
    });
  }

  async logout(): Promise<void> {
    await this.request('/Authorization/logout', {
      method: 'POST',
    });
  }

  // Платежи и услуги ЖКХ
  async getUtilityServices(): Promise<UtilityService[]> {
    return this.request('/payments/services', {
      method: 'GET',
    });
  }

  async submitMeterReading(readingData: MeterReadingCreateData): Promise<any> {
    return this.request('/payments/submit-reading', {
      method: 'POST',
      body: JSON.stringify(readingData),
    });
  }

  async getMyPayments(): Promise<Payment[]> {
    return this.request('/payments/my-payments', {
      method: 'GET',
    });
  }

  async createPayment(paymentData: PaymentCreateData): Promise<any> {
    return this.request('/payments/create-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async processPayment(paymentData: PaymentProcessingData): Promise<any> {
    return this.request('/payments/process-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getMyMeterReadings(): Promise<MeterReading[]> {
    return this.request('/payments/my-readings', {
      method: 'GET',
    });
  }

  async getMyReceipts(): Promise<Receipt[]> {
    return this.request('/payments/my-receipts', {
      method: 'GET',
    });
  }

  // Админ методы
  async getAllUsers(): Promise<User[]> {
    return this.request('/admin/users', {
      method: 'GET',
    });
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.request('/admin/payments', {
      method: 'GET',
    });
  }

  async getAllMeterReadings(): Promise<MeterReading[]> {
    return this.request('/admin/meter-readings', {
      method: 'GET',
    });
  }

  async createUtilityService(serviceData: any): Promise<UtilityService> {
    return this.request('/admin/utility-services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateUtilityService(serviceId: number, serviceData: any): Promise<UtilityService> {
    return this.request(`/admin/utility-services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async generateReceipts(period: string): Promise<any> {
    return this.request('/admin/generate-receipts', {
      method: 'POST',
      body: JSON.stringify({ period }),
    });
  }

  async getAllUtilityServices(): Promise<UtilityService[]> {
    return this.request('/admin/utility-services', {
      method: 'GET',
    });
  }

  async deleteUtilityService(serviceId: number): Promise<any> {
    return this.request(`/admin/utility-services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  isAdmin(user: User | null): boolean {
    return user?.role === 'admin';
  }

    // Баланс
  async getMyBalance(): Promise<BalanceInfo> {
    return this.request('/balance/my-balance', {
      method: 'GET',
    });
  }

  async depositBalance(depositData: BalanceDepositData): Promise<any> {
    return this.request('/balance/deposit', {
      method: 'POST',
      body: JSON.stringify(depositData),
    });
  }

  async getBalanceTransactions(): Promise<BalanceTransaction[]> {
    return this.request('/balance/transactions', {
      method: 'GET',
    });
  }

// Оплата через баланс (упрощенная)
  async payWithBalance(paymentId: number): Promise<any> {
    return this.request('/payments/process-payment', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId,
        card_number: "balance", // Заглушка для совместимости
        expiry_date: "12/99",
        cvv: "000"
      }),
    });
  }

  // Детальная информация о квитанции
  async getReceiptDetails(receiptId: number): Promise<ReceiptDetail> {
    return this.request(`/receipts/${receiptId}`, {
      method: 'GET',
    });
  }

  // Сравнение квитанций
  async compareReceipts(receiptId: number): Promise<ReceiptComparison> {
    return this.request(`/receipts/${receiptId}/compare`, {
      method: 'GET',
    });
  }

  // Все квитанции с деталями
  async getMyReceiptsDetailed(): Promise<ReceiptDetail[]> {
    return this.request('/receipts/user/my-receipts-detailed', {
      method: 'GET',
    });
  }

}

export const apiClient = new ApiClient();
