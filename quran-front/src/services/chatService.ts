import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ChatMessage {
    id: number;
    senderId: string;
    senderName: string;
    receiverId: string;
    content: string;
    sentAt: string;
    isRead: boolean;
    isMe: boolean;
}

export interface ChatUser {
    id: string;
    fullName: string;
    profilePictureUrl?: string;
    nextSessionDate?: string;
}

const getContacts = async (): Promise<ChatUser[]> => {
    const response = await axios.get(`${API_BASE_URL}/chat/contacts`);
    return response.data;
};

const getHistory = async (otherUserId: string): Promise<ChatMessage[]> => {
    const response = await axios.get(`${API_BASE_URL}/chat/history/${otherUserId}`);
    return response.data;
};

const sendMessage = async (receiverId: string, content: string): Promise<ChatMessage> => {
    const response = await axios.post(`${API_BASE_URL}/chat/send`, { receiverId, content });
    return response.data;
};

export default {
    getContacts,
    getHistory,
    sendMessage
};
