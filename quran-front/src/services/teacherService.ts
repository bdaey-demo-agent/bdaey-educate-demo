import api from './api';
import { BASE_URL } from '../config';
import type { Teacher, TeacherProfileResponse, CreateTeacherProfileDto } from '../types/teacher';

const formatMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;

    // Fix common typo in DB where colon is missing
    if (url.startsWith('https//') || url.startsWith('http//')) {
        url = url.replace('https//', 'https://').replace('http//', 'http://');
    }

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;

    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
};

const mapTeacherUrls = (teacher: any): any => {
    if (!teacher) return teacher;
    return {
        ...teacher,
        imageUrl: formatMediaUrl(teacher.profilePictureUrl) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
        profilePictureUrl: formatMediaUrl(teacher.profilePictureUrl),
        audioSampleUrl: formatMediaUrl(teacher.audioSampleUrl),
        nationalIdImageUrl: formatMediaUrl(teacher.nationalIdImageUrl),
        ijazaCertificateUrl: formatMediaUrl(teacher.ijazaCertificateUrl),
        qualificationCertificateUrl: formatMediaUrl(teacher.qualificationCertificateUrl),
        experienceCertificateUrl: formatMediaUrl(teacher.experienceCertificateUrl),
    };
};

const teacherService = {
    async getAllTeachers(
        page: number = 1,
        pageSize: number = 20,
        search?: string,
        category?: string,
        gender?: string,
        minPrice?: number,
        maxPrice?: number,
        isOnline?: boolean,
        sortBy?: string,
        minRating?: number,
        favoritesOnly?: boolean
    ): Promise<{ data: Teacher[], totalPages: number, totalCount: number }> {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });

        if (search) params.append('search', search);
        if (category && category !== 'الكل') params.append('category', category);
        if (gender && gender !== 'الكل') params.append('gender', gender);
        if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
        if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
        if (isOnline) params.append('isOnline', 'true');
        if (sortBy) params.append('sortBy', sortBy);
        if (minRating !== undefined && minRating > 0) params.append('minRating', minRating.toString());
        if (favoritesOnly) params.append('favoritesOnly', 'true');

        const response = await api.get(`/teachers?${params.toString()}`);

        // Handle paginated structure
        const teachersList = response.data.data || response.data;
        const totalPages = response.data.totalPages || 1;
        const totalCount = response.data.totalCount || teachersList.length;

        // Map profilePictureUrl to imageUrl for compatibility and properly prepend BASE_URL to all media
        const mappedTeachers = teachersList.map((teacher: any) => mapTeacherUrls(teacher));

        return { data: mappedTeachers, totalPages, totalCount };
    },

    async getMyProfile(): Promise<Teacher> {
        const response = await api.get('/teachers/me');
        return mapTeacherUrls(response.data);
    },

    async getTeacherById(id: number): Promise<Teacher> {
        const response = await api.get('/teachers/' + id);
        return mapTeacherUrls(response.data);
    },

    async getTeacherByUsername(username: string): Promise<TeacherProfileResponse> {
        const response = await api.get<TeacherProfileResponse>(`/teachers/user/${username}`);
        return mapTeacherUrls(response.data);
    },

    async getTeacherByUserId(userId: string): Promise<TeacherProfileResponse> {
        const response = await api.get<TeacherProfileResponse>(`/teachers/user-id/${userId}`);
        return mapTeacherUrls(response.data);
    },

    async createTeacherProfile(data: CreateTeacherProfileDto): Promise<Teacher> {
        const response = await api.post('/teachers', data);
        return mapTeacherUrls(response.data);
    },

    // Updated to accept FormData for file uploads
    async updateTeacherProfile(id: number, data: any): Promise<void> {
        let formData: FormData;

        if (data instanceof FormData) {
            formData = data;
        } else {
            formData = new FormData();
            Object.keys(data).forEach(key => {
                const value = data[key];
                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v));
                } else if (value !== null && value !== undefined) {
                    formData.append(key, value.toString());
                }
            });
        }

        await api.put('/teachers/' + id, formData, {
            headers: {
                'Content-Type': undefined,
            },
            timeout: 600000 // 10 minutes for large file uploads
        });
    },

    async deleteTeacherProfile(id: number): Promise<void> {
        await api.delete('/teachers/' + id);
    },

    async uploadAudio(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/teachers/upload-audio', formData, {
            headers: { 'Content-Type': undefined }, // Let browser set boundary
            timeout: 600000 // 10 minutes for audio uploads
        });
        return response.data.url;
    },

    async getPendingTeachers(): Promise<Teacher[]> {
        const response = await api.get('/teachers/admin/pending');
        return response.data.map((teacher: any) => mapTeacherUrls(teacher));
    },

    async updateTeacherStatus(id: number, status: 'Approved' | 'Rejected'): Promise<void> {
        await api.put('/teachers/' + id + '/status', `"${status}"`, {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async getMyStudents(): Promise<any[]> {
        const response = await api.get('/teachers/my-students');
        return response.data;
    },

    async getFavorites(): Promise<number[]> {
        const response = await api.get('/teachers/favorites');
        return response.data;
    },

    async toggleFavorite(id: number): Promise<{ isFavorite: boolean }> {
        const response = await api.post(`/teachers/${id}/favorite`);
        return response.data;
    }
};

export default teacherService;
