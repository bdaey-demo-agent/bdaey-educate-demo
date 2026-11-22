import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { AUTH_TOKEN_KEY, IS_SUSPENDED_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// Extended type to include our custom property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    }
});

let isLoggingOut = false;

// Single-flight refresh: concurrent 401s share one refresh call.
let refreshPromise: Promise<string | null> | null = null;

const tryRefreshAccessToken = (): Promise<string | null> => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (!refreshToken) return null;
            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const newToken = response.data?.token;
                const newRefreshToken = response.data?.refreshToken;
                if (!newToken) return null;
                localStorage.setItem(AUTH_TOKEN_KEY, newToken);
                if (newRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
                return newToken as string;
            } catch {
                return null;
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

// Request Interceptor
api.interceptors.request.use((config: CustomAxiosRequestConfig) => {
    // Add Correlation ID
    config.headers['X-Correlation-Id'] = uuidv4();

    // Add Auth Token
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<any>) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Prevent loops if we are already handling a forced logout
        if (isLoggingOut) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            const url = originalRequest?.url ?? '';
            const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/google') || url.includes('/auth/register');

            // Try a transparent token refresh once before giving up the session.
            if (!originalRequest._retry && !isAuthEndpoint && window.location.pathname !== '/login') {
                originalRequest._retry = true;
                const newToken = await tryRefreshAccessToken();
                if (newToken) {
                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
                handleLogout('session_expired');
            }
            return Promise.reject(error);
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            const errorCode = error.response.data?.code || error.response.data?.errorCode;
            const errorMessage = error.response.data?.message || '';

            // Explicitly check for blocked user indicators
            const isBlocked = errorCode === 'USER_BLOCKED' ||
                errorCode === 'AccountSuspended' ||
                errorMessage.toLowerCase().includes('blocked') ||
                errorMessage.toLowerCase().includes('suspended');

            if (isBlocked) {
                handleLogout('account_blocked');
            }
            // For other 403s (e.g. role access), we just reject and let the UI handle the toast
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

// Helper to handle forced logout cleanly
const handleLogout = (reason: 'session_expired' | 'account_blocked') => {
    if (isLoggingOut) return;
    isLoggingOut = true;

    // Clear storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (reason === 'account_blocked') {
        localStorage.setItem(IS_SUSPENDED_KEY, 'true');
        window.dispatchEvent(new Event('auth:logout:blocked'));
    } else {
        window.dispatchEvent(new Event('auth:logout:expired'));
    }

    // Redirect to login
    window.location.href = '/login';
};

export default api;
