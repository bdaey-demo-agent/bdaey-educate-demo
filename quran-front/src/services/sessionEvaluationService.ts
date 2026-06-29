import api from './api';

export interface SessionEvaluationCreateDto {
    sessionId: number;
    studentId: string;
    memorizedSurah?: string;
    memorizedAyahFrom?: number;
    memorizedAyahTo?: number;
    revisedSurah?: string;
    revisedAyahFrom?: number;
    revisedAyahTo?: number;
    evaluationScore: number;
    teacherNotes?: string;
}

export interface SessionEvaluationResponseDto {
    id: number;
    sessionId: number;
    teacherProfileId: number;
    studentId: string;
    teacherName: string;
    studentName: string;
    memorizedSurah?: string;
    memorizedAyahFrom?: number;
    memorizedAyahTo?: number;
    revisedSurah?: string;
    revisedAyahFrom?: number;
    revisedAyahTo?: number;
    evaluationScore: number;
    teacherNotes?: string;
    createdAt: string;
}

const createEvaluation = async (dto: SessionEvaluationCreateDto): Promise<SessionEvaluationResponseDto> => {
    const response = await api.post('/sessionevaluations', dto);
    return response.data;
};

const getEvaluation = async (id: number): Promise<SessionEvaluationResponseDto> => {
    const response = await api.get(`/sessionevaluations/${id}`);
    return response.data;
};

const getStudentEvaluations = async (studentId: string): Promise<SessionEvaluationResponseDto[]> => {
    const response = await api.get(`/sessionevaluations/student/${studentId}`);
    return response.data;
};

export const sessionEvaluationService = {
    createEvaluation,
    getEvaluation,
    getStudentEvaluations
};
