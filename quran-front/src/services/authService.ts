import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { REFRESH_TOKEN_KEY } from '../constants';


const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
};

const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
};

const updateProfile = async (data: { fullName: string; phoneNumber?: string; email?: string; gender?: string }) => {
    const response = await api.put('/auth/profile', data);

    // The backend now returns a completely new AuthResponseDto if the profile succeeds
    // We update local storage with the new token and user object
    if (response.data && response.data.token) {
        localStorage.setItem('user', JSON.stringify({
            id: response.data.id,
            email: response.data.email,
            fullName: response.data.fullName,
            role: response.data.role,
            userName: response.data.userName,
            gender: response.data.gender,
            emailConfirmed: response.data.emailConfirmed
        }));
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
    }
    return response.data;
};

// Best-effort server-side revocation of the refresh token.
// Local cleanup always happens in AuthContext regardless of the outcome.
const logout = async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return;
    try {
        await api.post('/auth/logout', { refreshToken });
    } catch {
        // Ignore network failures - the token expires on its own.
    }
};

const changePassword = async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

const getProfile = async () => {
    const response = await api.get('/auth/profile');
    return response.data;
};

const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

const resetPassword = async (data: any) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
};

const checkUsernameAvailability = async (username: string) => {
    const response = await api.get('/auth/check-username', { params: { username } });
    return response.data.isAvailable;
};

const authService = {
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getProfile,
    forgotPassword,
    resetPassword,
    checkUsernameAvailability
};

export default authService;
