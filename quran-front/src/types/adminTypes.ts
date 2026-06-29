// Basic Types
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface AdminStats {
    totalUsers: number;
    activeUsersCount: number;
    totalStudents: number;
    totalTeachers: number;
    pendingTeachers: number;
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalVolume: number;
    newUsersLast7Days: number;
    pendingWithdrawals: number;
    pendingWithdrawalsAmount: number;
    completedSessions: number;
}

// Teacher Types
export interface AdminTeacher {
    id: number;
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    isApproved: boolean;
    isBlocked: boolean;
    status: string;
    commissionRate?: number;
    scheduledCommissionRate?: number;
    scheduledCommissionUntil?: string;
    title: string;
    createdAt: string;
    // Details
    educationDegree?: string;
    isHafiz?: boolean;
    hasIjaza?: boolean;
    ijazaType?: string;
    ijazaIssuer?: string;
    experienceYears?: string;
    subjects?: string[];
    audioSampleUrl?: string;
    socialLinks?: string;
    bio?: string;
    priceStart?: number;
    nationalIdImageUrl?: string;
    ijazaCertificateUrl?: string;
    qualificationCertificateUrl?: string;
    experienceCertificateUrl?: string;
    nationalId?: string;
    dateOfBirth?: string;
    packageDeletionPenalty?: number;
    isDataSubmitted: boolean;
    showAudioSample?: boolean;
    showQualificationCertificate?: boolean;
    showExperienceCertificate?: boolean;
    showIjazaCertificate?: boolean;
}

export interface AdminStudent {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    createdAt: string;
    isBlocked: boolean;
}

export interface UnifiedUser {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    isBlocked: boolean;
    createdAt: string;
    emailConfirmed: boolean;
    emailConfirmationSentAt?: string;
}

// Booking Types
export interface AdminBooking {
    id: number;
    studentName: string;
    teacherName: string;
    packageName: string;
    status: string;
    totalPrice: number;
    currency: string;
    createdAt: string;
    confirmedAt?: string;
    cancelledAt?: string;
}

// Wallet Types
export interface WithdrawalRequest {
    id: number;
    teacherId: string;
    teacherName: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paymentDetails: string;
    requestedAt: string;
    referenceCode?: string;
    adminNote?: string;
    rejectionReason?: string;
}

// Package Management Interfaces
export interface AdminPackage {
    id: number;
    teacherProfileId: number;
    name: string;
    description: string;
    sessionsCount: number;
    durationMinutes: number;
    price: number;
    currency: string;
    status: 'Active' | 'Paused' | 'Archived' | 'Default';
    availableDays: number[];
    startTime: string;
    endTime: string;
    maxStudents: number;
    periodType: string;
    sessionsPerWeek: number;
    sessionBufferMinutes: number;
    startDate: string;
    timezoneId: string;
    teacherName: string;
    teacherEmail: string;
    totalBookingsCount: number;
    createdAt: string;
}

export interface AdminPackageDetail extends AdminPackage {
    pendingBookingsCount: number;
    completedBookingsCount: number;
    cancelledBookingsCount: number;
    upcomingSessionsCount: number;
    lastBookingDate?: string;
    canDelete: boolean;
    adminNote?: string;
    auditLogs: string[];
}

export interface AdminPackageFilter {
    search?: string;
    status?: number; // Enum: 1=Active, 2=Paused, 3=Archived
    teacherId?: number;
    hasBookings?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    pageSize: number;
}
