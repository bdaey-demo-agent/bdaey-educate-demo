export interface Session {
    id: number;
    teacherName: string;
    studentName: string;
    scheduledAt: string;
    status: string;
    roomUrl?: string;
    durationMinutes: number;
}

export interface StudentDashboardData {
    walletBalance: number;
    currency: string;
    activeBookingsCount: number;
    unreadNotificationsCount: number;
    nextSession?: Session;
}
