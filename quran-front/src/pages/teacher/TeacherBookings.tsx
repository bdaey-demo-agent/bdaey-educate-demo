import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/solid';
import bookingsService from '../../services/bookingsService';
import type { Booking } from '../../types/booking';
import BookingsSkeleton from '../../components/skeletons/BookingsSkeleton';

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';

const TeacherBookings: React.FC = () => {
    const navigate = useNavigate();
    // const queryClient = useQueryClient(); // Removed
    const [filter, setFilter] = useState<'all' | 'Pending' | 'Confirmed'>('all');

    // State for bookings
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Reject Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [bookingToReject, setBookingToReject] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingsService.getMyTeacherBookings();
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('فشل تحميل الحجوزات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleAccept = async (bookingId: number) => {
        const toastId = toast.loading('جاري قبول الحجز...');
        try {
            await bookingsService.updateBookingStatus(bookingId, 'Confirmed');
            toast.success('تم قبول الحجز بنجاح', { id: toastId });
            fetchBookings();
        } catch (error) {
            console.error('Error accepting booking:', error);
            toast.error('حدث خطأ أثناء قبول الحجز', { id: toastId });
        }
    };

    const handleRejectClick = (bookingId: number) => {
        setBookingToReject(bookingId);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!bookingToReject) return;

        const toastId = toast.loading('جاري رفض الحجز...');
        try {
            await bookingsService.updateBookingStatus(bookingToReject, 'Cancelled', rejectReason || 'رفض من قبل المعلم');
            toast.success('تم رفض الحجز', { id: toastId });
            setShowRejectModal(false);
            fetchBookings();
        } catch (error) {
            console.error('Error rejecting booking:', error);
            toast.error('حدث خطأ أثناء رفض الحجز', { id: toastId });
        }
    };

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const pendingCount = bookings.filter(b => b.status === 'Pending').length;
    const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;

    const getStatusBadge = (status: string) => {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {translateStatus(status)}
            </span>
        );
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    طلبات الحجز
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    إدارة طلبات الحجز من الطلاب
                </p>
            </div>

            {loading ? (
                <BookingsSkeleton />
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">طلبات جديدة</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
                                </div>
                                <div className="p-3 rounded-full bg-yellow-500 text-white bg-opacity-90">
                                    <CalendarIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">حجوزات مؤكدة</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{confirmedCount}</p>
                                </div>
                                <div className="p-3 rounded-full bg-green-500 text-white bg-opacity-90">
                                    <CheckCircleIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي الطلبات</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</p>
                                </div>
                                <div className="p-3 rounded-full bg-blue-500 text-white bg-opacity-90">
                                    <UserIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="mb-6 flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-gold-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            الكل ({bookings.length})
                        </button>
                        <button
                            onClick={() => setFilter('Pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'Pending'
                                ? 'bg-gold-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            في الانتظار ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilter('Confirmed')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'Confirmed'
                                ? 'bg-gold-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            مؤكدة ({confirmedCount})
                        </button>
                    </div>

                    {/* Bookings List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                        {filteredBookings.length === 0 ? (
                            <div className="p-8 text-center">
                                <CalendarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {filter === 'Pending' ? 'لا توجد طلبات في الانتظار' : filter === 'Confirmed' ? 'لا توجد حجوزات مؤكدة' : 'لا توجد أي طلبات حتى الآن'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y dark:divide-gray-700">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.id} className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-white font-bold">
                                                        {booking.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{booking.studentName}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">الباقة: {booking.packageName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        {booking.sessionsCount} جلسة
                                                    </span>
                                                    <span>
                                                        {booking.totalPrice} {booking.currency}
                                                    </span>
                                                    <span>
                                                        {new Date(booking.createdAt).toLocaleDateString('ar-EG')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                {getStatusBadge(booking.status)}

                                                {booking.status === 'Confirmed' && (
                                                    <button
                                                        onClick={() => {
                                                            navigate('/teacher/chat', {
                                                                state: {
                                                                    selectedUser: {
                                                                        id: booking.studentId,
                                                                        fullName: booking.studentName,
                                                                        profilePictureUrl: null // or pass if available in booking
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors mt-2"
                                                    >
                                                        <span className="h-4 w-4">💬</span> {/* Or use Icon */}
                                                        محادثة
                                                    </button>
                                                )}

                                                {booking.status === 'Pending' && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleAccept(booking.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                        >
                                                            <CheckCircleIcon className="h-4 w-4" />
                                                            قبول
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(booking.id)}
                                                            className="flex-1 py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <XCircleIcon className="h-4 w-4" />
                                                            رفض
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">رفض طلب الحجز</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                يرجى ذكر سبب الرفض (اختياري) ليتم إبلاغ الطالب
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                سبب الرفض
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                rows={3}
                                placeholder="اكتب السبب هنا..."
                            ></textarea>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmReject}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                تأكيد الرفض
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherBookings;
