import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const getNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

const markAsRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`);
};

const markAllAsRead = async () => {
    await api.put('/notifications/read-all');
};

const sendNotification = async (data: { targetType: string; targetId?: string; targetIds?: string[]; title: string; message: string; }) => {
    const response = await api.post('/notifications/send', data);
    return response.data;
};

const notificationService = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification
};

export default notificationService;
