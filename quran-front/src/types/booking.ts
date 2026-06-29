export interface Package {
    id: number;
    teacherProfileId: number;
    name: string;
    description: string;
    sessionsCount: number;
    durationMinutes: number;
    price: number;
    currency: string;
    isActive: boolean;
    availableDays?: number[];
    startTime?: string;
    endTime?: string;
    maxStudents?: number;
    activeBookingsCount?: number;

    // New Configs
    periodType?: 'Weekly' | 'Monthly' | 'Yearly';
    sessionsPerWeek?: number;
    sessionBufferMinutes?: number;
    startDate?: string;
    endDate?: string;
    timezoneId?: string;
    allowedGender?: 'All' | 'Male' | 'Female';

    // Status
    status?: string;
    hasActiveBookings?: boolean;
    hasPendingBookings?: boolean;
    currentUserBookingStatus?: string;
}

export interface Booking {
    id: number;
    studentId: string;
    studentName: string;
    teacherProfileId: number;
    teacherName: string;
    packageId: number | null;
    packageName: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    totalPrice: number;
    currency: string;
    createdAt: string;
    sessionsCount: number;
}

export interface CreatePackageRequest {
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    availableDays: number[];
    startTime: string;
    endTime: string;
    maxStudents: number;

    // Configs
    periodType: 'Weekly' | 'Monthly' | 'Yearly';
    sessionsPerWeek: number;
    sessionBufferMinutes: number;
    startDate: string;
    timezoneId?: string;
    allowedGender: 'All' | 'Male' | 'Female';
}

export interface CreateBookingDto {
    teacherProfileId: number;
    packageId: number;
    proposedTimes: string[]; // ISO date strings
    timezoneId?: string;
}
