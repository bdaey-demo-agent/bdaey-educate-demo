import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';


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
    }
    return response.data;
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
    updateProfile,
    changePassword,
    getProfile,
    forgotPassword,
    resetPassword,
    checkUsernameAvailability
};

export default authService;
