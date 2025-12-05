import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Типы данных
export interface User {
  id: string;
  nickname: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Сервис авторизации
export const authService = {
  // Регистрация
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  },

  // Вход
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
  },

  // Выход
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Сохранение токена и пользователя
  setAuthData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Получение токена
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Получение пользователя
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Проверка авторизации
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Настройка axios с токеном
  setupAxiosInterceptors(): void {
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  },
};