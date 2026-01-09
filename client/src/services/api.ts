import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { API_URL } from "../lib/constants";

interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: any) {
    return this.api.get<ApiResponse<T>>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.api.post<ApiResponse<T>>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.api.put<ApiResponse<T>>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.api.delete<ApiResponse<T>>(url, config);
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.api.patch<ApiResponse<T>>(url, data, config);
  }
}

export default new ApiService();