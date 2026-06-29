import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    reason?: string;
    dateSent: string; // or Date
    isRead: boolean;
}

export interface ContactForm {
    name: string;
    email: string;
    reason?: string;
    subject: string;
    message: string;
}

const messageService = {
    // Public: Send a message
    sendMessage: async (data: ContactForm) => {
        const response = await axios.post(`${API_BASE_URL}/contact`, data);
        return response.data;
    },

    // Admin: Get all messages
    getAllMessages: async () => {
        const response = await axios.get<ContactMessage[]>(`${API_BASE_URL}/contact`);
        return response.data;
    },

    // Admin: Mark message as read
    markAsRead: async (id: number) => {
        const response = await axios.put(`${API_BASE_URL}/contact/${id}/read`);
        return response.data;
    }
};

export default messageService;
