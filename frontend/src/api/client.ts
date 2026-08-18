import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Department,
  CreateLeaveRequestPayload,
  LeaveDecisionPayload,
  AnalyticsSummary,
  ForecastResult,
} from '../types';

// In-memory token storage (as specified in DECISIONS.md)
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const setAuthTokens = (access: string | null, refresh: string | null = null) => {
  memoryAccessToken = access;
  if (refresh !== null) {
    memoryRefreshToken = refresh;
  }
};

export const getAccessToken = () => memoryAccessToken;
export const getRefreshToken = () => memoryRefreshToken;

export const clearAuthTokens = () => {
  memoryAccessToken = null;
  memoryRefreshToken = null;
};

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (memoryAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry login or refresh requests
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (!memoryRefreshToken) {
        isRefreshing = false;
        clearAuthTokens();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: memoryRefreshToken,
        });

        const newAccessToken = data.access_token;
        setAuthTokens(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthTokens();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- API Service Methods ---

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>('/auth/login', { email, password });
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },
};

export const leaveTypeApi = {
  list: async (): Promise<LeaveType[]> => {
    const response = await apiClient.get<LeaveType[]>('/leave-types');
    return response.data;
  },
};

export const leaveBalanceApi = {
  getMyBalances: async (): Promise<LeaveBalance[]> => {
    const response = await apiClient.get<LeaveBalance[]>('/leave-balances/me');
    return response.data;
  },
};

export const leaveRequestApi = {
  create: async (payload: CreateLeaveRequestPayload): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>('/leave-requests', payload);
    return response.data;
  },
  getMyRequests: async (): Promise<LeaveRequest[]> => {
    const response = await apiClient.get<LeaveRequest[]>('/leave-requests/me');
    return response.data;
  },
  getTeamRequests: async (): Promise<LeaveRequest[]> => {
    const response = await apiClient.get<LeaveRequest[]>('/leave-requests/team');
    return response.data;
  },
  cancel: async (requestId: string): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leave-requests/${requestId}/cancel`);
    return response.data;
  },
  decide: async (requestId: string, payload: LeaveDecisionPayload): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(
      `/leave-requests/${requestId}/decision`,
      payload
    );
    return response.data;
  },
};

export const departmentApi = {
  list: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/departments');
    return response.data;
  },
};

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>('/analytics/summary');
    return response.data;
  },
  getForecast: async (): Promise<ForecastResult> => {
    const response = await apiClient.get<ForecastResult>('/analytics/forecast');
    return response.data;
  },
};
