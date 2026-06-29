import api from './api';
import type { Booking, CreateBookingDto } from '../types/booking';

const bookingsService = {
    // Get my bookings (Student)
    getMyBookings: async (): Promise<Booking[]> => {
        const response = await api.get<Booking[]>('/bookings/my-bookings');
        return response.data;
    },

    // Get my bookings as teacher
    getMyTeacherBookings: async (): Promise<Booking[]> => {
        const response = await api.get<Booking[]>('/bookings/my-bookings');
        return response.data;
    },

    // Create a new booking
    createBooking: async (booking: CreateBookingDto): Promise<Booking> => {
        const response = await api.post<Booking>('/bookings', booking);
        return response.data;
    },

    // Update booking status
    updateBookingStatus: async (bookingId: number, status: string, reason?: string): Promise<void> => {
        await api.put(`/bookings/${bookingId}/status`, { status, reason });
    }
};

export default bookingsService;
