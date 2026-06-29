import api from './api';
import type { Session, UpdateSessionDto } from '../types/session';

const sessionsService = {
    getMySessions: async (): Promise<Session[]> => {
        const response = await api.get<Session[]>('/sessions/my-sessions');
        return response.data;
    },

    updateSession: async (id: number, dto: UpdateSessionDto): Promise<Session> => {
        const response = await api.put<Session>(`/sessions/${id}`, dto);
        return response.data;
    },

    updateSessionLink: async (id: number, link: string): Promise<Session> => {
        const response = await api.put<Session>(`/sessions/${id}`, { meetingLink: link });
        return response.data;
    },

    updateSessionStatus: async (id: number, status: 'Confirmed' | 'Cancelled' | 'InProgress' | 'Completed'): Promise<Session> => {
        // Use the general update endpoint with status in body
        const response = await api.put<Session>(`/sessions/${id}`, { status });
        return response.data;
    },

    rateSession: async (id: number, rating: number, comment: string) => {
        await api.post(`/sessions/${id}/review`, { rating, comment });
    }
};

export default sessionsService;
