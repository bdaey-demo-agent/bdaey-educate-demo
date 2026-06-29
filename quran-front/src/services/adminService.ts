import api from './api';

import type {
    AdminStats,
    AdminTeacher,
    AdminStudent,
    UnifiedUser,
    AdminBooking,
    WithdrawalRequest,
    AdminPackage,
    AdminPackageDetail,
    AdminPackageFilter,
    PagedResult
} from '../types/adminTypes';





const getStats = async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
};

const getGlobalCommission = async (): Promise<number> => {
    const response = await api.get('/admin/settings/commission');
    return response.data.globalCommission;
};

const updateGlobalCommission = async (rate: number): Promise<void> => {
    await api.put('/admin/settings/commission', rate, {
        headers: { 'Content-Type': 'application/json' }
    });
};

const getTeachers = async (): Promise<AdminTeacher[]> => {
    const response = await api.get('/admin/teachers');
    return response.data;
};

const updateTeacherCommission = async (id: number, rate: number | null, duration?: number, unit?: string): Promise<void> => {
    await api.put(`/admin/teachers/${id}/commission`, { rate, duration, unit }, {
        headers: { 'Content-Type': 'application/json' }
    });
};

const approveTeacher = async (id: number): Promise<void> => {
    await api.put(`/teachers/${id}/status`, JSON.stringify("Approved"), {
        headers: { 'Content-Type': 'application/json' }
    });
};

const getStudents = async (): Promise<AdminStudent[]> => {
    const response = await api.get('/admin/students');
    return response.data;
};

const toggleBlockUser = async (id: string, isBlocked: boolean, reason: string = ''): Promise<void> => {
    await api.post(`/admin/users/${id}/block`, { isBlocked, reason });
};

const getGlobalDeletionPenalty = async (): Promise<number> => {
    try {
        const response = await api.get('/platform-settings/PackageDeletionPenalty');
        return parseFloat(response.data.value);
    } catch (error) {
        return 50; // Default fallback
    }
};

const updateGlobalDeletionPenalty = async (amount: number): Promise<void> => {
    await api.post('/platform-settings', {
        key: 'PackageDeletionPenalty',
        value: amount.toString(),
        description: 'Global penalty amount for deleting active packages'
    });
};

const updateTeacherDeletionPenalty = async (id: number, amount: number | null): Promise<void> => {
    await api.put(`/teachers/${id}/penalty`, amount, {
        headers: { 'Content-Type': 'application/json' }
    });
};

const getAllBookings = async (filters?: { status?: string, from?: string, to?: string, search?: string }): Promise<AdminBooking[]> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get('/admin/bookings', { params });
    return response.data;
};

const getBookingDetails = async (id: number): Promise<any> => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data;
};

const updateBookingStatus = async (id: number, status: string): Promise<void> => {
    await api.put(`/admin/bookings/${id}/status`, { status });
};

const cancelBooking = async (id: number, reason: string, refundMode: string, refundAmount?: number, adminNote?: string): Promise<void> => {
    await api.post(`/admin/bookings/${id}/cancel`, { reason, refundMode, refundAmount, adminNote });
};

const getWithdrawals = async (status?: string): Promise<WithdrawalRequest[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/wallet/withdrawals', { params });
    return response.data;
};

const processWithdrawal = async (id: number, action: 'Approve' | 'Reject', note?: string, referenceCode?: string, rejectionReason?: string): Promise<void> => {
    await api.put(`/admin/wallet/withdrawals/${id}/process`, { action, note, referenceCode, rejectionReason });
};

const getAllUsers = async (role?: string, search?: string): Promise<UnifiedUser[]> => {
    const params: any = {};
    if (role) params.role = role;
    if (search) params.search = search;
    const response = await api.get('/admin/users', { params });
    return response.data.data || response.data;
};

const blockUser = async (id: string, isBlocked: boolean, reason: string): Promise<void> => {
    await api.put(`/admin/users/${id}/block`, { isBlocked, reason });
};

const deleteUser = async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
};

const resendVerificationEmail = async (id: string): Promise<void> => {
    await api.post(`/admin/users/${id}/resend-verification`);
};

const resetUserPassword = async (id: string, newPassword: string): Promise<void> => {
    await api.post(`/admin/users/${id}/reset-password`, { newPassword });
};

const impersonateUser = async (id: string): Promise<any> => {
    const response = await api.post(`/admin/users/${id}/impersonate`);
    return response.data;
};

const adminService = {
    getStats,
    getGlobalCommission,
    updateGlobalCommission,
    getGlobalDeletionPenalty,
    updateGlobalDeletionPenalty,
    getTeachers,
    updateTeacherCommission,
    updateTeacherDeletionPenalty,
    approveTeacher,
    getStudents,
    toggleBlockUser,
    getAllBookings,
    getBookingDetails,
    updateBookingStatus,
    cancelBooking,
    getWithdrawals,
    processWithdrawal,
    getAllUsers,
    blockUser,
    deleteUser,
    resendVerificationEmail,
    resetUserPassword,
    impersonateUser,

    // Packages
    getPackages: async (filter: AdminPackageFilter) => {
        const response = await api.get<PagedResult<AdminPackage>>('/admin/packages', { params: filter });
        return response.data;
    },

    getPackageDetails: async (id: number) => {
        const response = await api.get<AdminPackageDetail>(`/admin/packages/${id}`);
        return response.data;
    },

    updatePackageStatus: async (id: number, status: number, reason?: string) => {
        await api.put(`/admin/packages/${id}/status`, { status, reason });
    },

    deletePackage: async (id: number) => {
        await api.delete(`/admin/packages/${id}`);
    },

    // Promo Codes
    getPromoCodes: async () => {
        const response = await api.get('/admin/promo-codes');
        return response.data;
    },

    createPromoCode: async (data: { code: string; amount: number; maxUses: number; expiryDate?: string }) => {
        const response = await api.post('/admin/promo-codes', data);
        return response.data;
    },

    togglePromoCodeStatus: async (id: number) => {
        await api.put(`/admin/promo-codes/${id}/toggle`);
    },

    deletePromoCode: async (id: number) => {
        await api.delete(`/admin/promo-codes/${id}`);
    },

    fixSubmissionStatuses: async (): Promise<{ count: number }> => {
        const response = await api.post('/admin/fix-submission-statuses');
        return response.data;
    },

    clearManualCache: async (): Promise<void> => {
        await api.post('/admin/clear-cache');
    },

    getTeacherProfile: async (id: number): Promise<AdminTeacher> => {
        const response = await api.get(`/admin/teachers/${id}`);
        return response.data;
    }
};

export default adminService;
