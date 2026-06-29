import api from './api';
import { signalRService } from './signalrService';

export interface VideoRoomInfo {
    roomName: string;
    roomUrl: string;
    provider: string;
}

export interface VideoJoinInfo {
    provider: string;
    roomUrl: string;
    token: string;
    displayName: string;
    scheduledAt: string;
    durationMinutes: number;
    studentId?: string;
}

export const videoService = {
    prepareRoom: async (sessionId: number): Promise<VideoRoomInfo> => {
        const response = await api.post<VideoRoomInfo>(`/video/sessions/${sessionId}/prepare`);
        return response.data;
    },

    getJoinInfo: async (sessionId: number): Promise<VideoJoinInfo> => {
        const connectionId = signalRService.getConnectionId();
        const url = connectionId
            ? `/video/sessions/${sessionId}/join?connectionId=${encodeURIComponent(connectionId)}`
            : `/video/sessions/${sessionId}/join`;

        const response = await api.get<VideoJoinInfo>(url);
        return response.data;
    }
};
