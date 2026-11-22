import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, IS_SUSPENDED_KEY } from '../constants';
import authService from '../services/authService';
import { signalRService } from '../services/signalrService';
import toast from 'react-hot-toast';
import { safeJsonParse } from '../utils/helpers';
import './TenantBlocked.css';

interface User {
    id?: string;
    email: string;
    fullName: string;
    role?: string;
    userName?: string;
    isBlocked?: boolean;
    phoneNumber?: string;
    profilePictureUrl?: string;
    emailConfirmed?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User, refreshToken?: string) => void;
    register: (email: string, password: string, fullName: string, phoneNumber: string, dateOfBirth: Date, gender: string, role?: string, username?: string) => Promise<void>;
    logout: (reason?: 'session_expired' | 'account_blocked' | 'manual') => void;
    resendVerification: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const checkTenantAndLoadUser = async () => {


            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(safeJsonParse(storedUser, null));
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
            setIsLoading(false);
        };

        checkTenantAndLoadUser();
    }, []);

    // Listen for events from api.ts
    useEffect(() => {
        const handleSessionExpired = () => logout('session_expired');
        const handleAccountBlocked = () => logout('account_blocked');

        window.addEventListener('auth:logout:expired', handleSessionExpired);
        window.addEventListener('auth:logout:blocked', handleAccountBlocked);

        return () => {
            window.removeEventListener('auth:logout:expired', handleSessionExpired);
            window.removeEventListener('auth:logout:blocked', handleAccountBlocked);
        };
    }, []);

    // Listen for storage changes (Multi-tab sync)
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === AUTH_TOKEN_KEY && event.newValue === null) {
                // Token removed in another tab
                setToken(null);
                setUser(null);
                delete axios.defaults.headers.common['Authorization'];
                signalRService.stopConnection();
                window.location.href = '/login';
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        // undefined: keep the existing stored refresh token (e.g. impersonation flows
        // that receive no new one). A passed value always replaces it.
        if (newRefreshToken !== undefined) {
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }
        localStorage.removeItem(IS_SUSPENDED_KEY); // Clear suspension flag
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const register = async (
        email: string,
        password: string,
        fullName: string,
        phoneNumber: string,
        dateOfBirth: Date,
        gender: string,
        role: string = 'User',
        username?: string
    ) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                email,
                password,
                fullName,
                phoneNumber,
                dateOfBirth,
                gender,
                role,
                userName: username
            });

            // If backend auto-logs in after register, we can handle it.
            // For now, we assume successful registration just needs redirect to login or auto-login.
            // If the response returns token, we can login immediately.
            if (response.data && response.data.token) {
                const userData = {
                    id: response.data.id || response.data.userId,
                    email: response.data.email,
                    fullName: response.data.fullName || fullName,
                    role: role, // Use the role passed to register
                    userName: username || response.data.userName,
                    emailConfirmed: response.data.emailConfirmed || false
                };

                // If it's a student and a token is returned, login immediately
                if (response.data.token) {
                    login(response.data.token, userData, response.data.refreshToken);
                }
            }

        } catch (error) {
            throw error;
        }
    };

    const resendVerification = async () => {
        try {
            await axios.post(`${API_BASE_URL}/auth/resend-verification`);
            toast.success('Activation link sent. Check your inbox (and the Spam folder).');
        } catch (error: any) {
            toast.error(error.response?.data || error.message || 'Error sending the email');
        }
    };

    const logout = (reason?: 'session_expired' | 'account_blocked' | 'manual') => {
        // 0. Revoke the refresh token server-side (fire and forget)
        if (reason === undefined || reason === 'manual') {
            authService.logout();
        }

        // 1. Clear State
        setToken(null);
        setUser(null);

        // 2. Clear Storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(IS_SUSPENDED_KEY);
        delete axios.defaults.headers.common['Authorization'];

        // 4. Stop SignalR
        signalRService.stopConnection();

        // 5. User Feedback & Redirect
        if (reason === 'session_expired') {
            toast.error('Session expired. Please sign in again');
            window.location.href = '/login';
        } else if (reason === 'account_blocked') {
            toast.error('Your account has been blocked. Please contact support');
            localStorage.setItem(IS_SUSPENDED_KEY, 'true');
            window.location.href = '/suspended';
        } else {
            // Manual logout
            window.location.href = '/';
        }
    };



    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, resendVerification, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
