export interface LoginRequest {
    email?: string;
    password?: string;
    phoneNumber?: string;
}

export interface RegisterRequest {
    userType: 'Student' | 'Teacher';
    fullName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    gender?: string;
    emailConfirmed?: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
    refreshToken?: string;
    expiresAt?: string;
}
