export interface Session {
    id: number;
    bookingId: number;
    studentId: string;
    studentName: string;
    teacherProfileId: number;
    teacherName: string;
    scheduledAt: string; // ISO date
    durationMinutes: number;
    status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';
    bookingStatus?: string;
    roomUrl?: string;
    recordingUrl?: string;
    rating?: number;
    hasEvaluation?: boolean;
}

export interface UpdateSessionDto {
    status?: string;
    roomUrl?: string;
    recordingUrl?: string;
    rescheduledAt?: string;
}
