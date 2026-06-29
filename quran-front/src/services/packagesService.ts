import api from './api';
import type { Package } from '../types/booking';

const toISOWithOffset = (date: Date) => {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
};

const packagesService = {
    // Get packages for a specific teacher
    getTeacherPackages: async (teacherId: number): Promise<Package[]> => {
        const response = await api.get<Package[]>(`/packages/teacher/${teacherId}`);
        return response.data;
    },

    // Create a new package (Teacher only)
    createPackage: async (packageData: any): Promise<Package> => {
        const response = await api.post<Package>('/packages', packageData);
        return response.data;
    },

    updatePackage: async (id: number, packageData: any): Promise<Package> => {
        const response = await api.put<Package>(`/packages/${id}`, packageData);
        return response.data;
    },

    // Delete (soft) a package
    deletePackage: async (packageId: number, applyPenalty: boolean = true): Promise<void> => {
        await api.delete(`/packages/${packageId}?applyPenalty=${applyPenalty}`);
    },

    // Restore an archived/paused package
    restorePackage: async (packageId: number, newStartDate?: string): Promise<Package> => {
        const body = newStartDate ? { startDate: newStartDate } : {};
        const response = await api.post<Package>(`/packages/${packageId}/restore`, body);
        return response.data;
    },

    getAvailableSlots: async (packageId: number, start?: Date, end?: Date): Promise<string[]> => {
        const params = new URLSearchParams();
        if (start) params.append('start', toISOWithOffset(start));
        if (end) params.append('end', toISOWithOffset(end));

        const response = await api.get<string[]>(`/packages/${packageId}/slots?${params.toString()}`);
        return response.data;
    },

    getMyPackageSlots: async (packageId: number): Promise<string[]> => {
        const response = await api.get<string[]>(`/packages/${packageId}/my-slots`);
        return response.data;
    }
};

export default packagesService;
