import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    BookOpenIcon,
    CalendarIcon,
    UserIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import bookingsService from '../../services/bookingsService';
import type { Booking } from '../../types/booking';
import toast from 'react-hot-toast';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';
import { gamificationService, type StudentGamificationProfileDto } from '../../services/gamificationService';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [gamificationProfile, setGamificationProfile] = useState<StudentGamificationProfileDto | null>(null);
    const [loadingGamification, setLoadingGamification] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setLoadingGamification(true);
            const [bookingsData, gamificationData] = await Promise.all([
                bookingsService.getMyBookings(),
                gamificationService.getMyProfile()
            ]);
            setBookings(bookingsData || []);
            setGamificationProfile(gamificationData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('حدث خطأ أثناء جلب البيانات');
        } finally {
            setLoading(false);
            setLoadingGamification(false);
        }
    };

    // Cancel Modal State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    // Checklist Logic
    // Checklist items removed

    // Calculate stats from real bookings
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const totalSessions = bookings.reduce((sum, b) => sum + b.sessionsCount, 0);

    const stats = [
        { name: 'الحجوزات المؤكدة', value: confirmedBookings.toString(), icon: CheckCircleIcon, color: 'text-success-text bg-success-bg' },
        { name: 'في انتظار الموافقة', value: pendingBookings.toString(), icon: ExclamationCircleIcon, color: 'text-warning-text bg-warning-bg' },
        { name: 'إجمالي الجلسات', value: totalSessions.toString(), icon: BookOpenIcon, color: 'text-secondary-blue bg-blue-50' },
    ];

    const getStatusBadge = (status: string) => {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
                {translateStatus(status)}
            </span>
        );
    };

    const handleCancelClick = (bookingId: number) => {
        setBookingToCancel(bookingId);
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        try {
            await bookingsService.updateBookingStatus(bookingToCancel, 'Cancelled', 'إلغاء من قبل الطالب');
            toast.success('تم إلغاء الحجز بنجاح');
            setShowCancelModal(false);
            fetchDashboardData();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('حدث خطأ أثناء الإلغاء');
        }
    };

    return (
        <div className="animate-fade-in font-body">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-primary-gold mb-2">
                        مرحباً، {user?.fullName} 👋
                    </h1>
                    <p className="text-text-secondary text-lg">
                        تابع تقدمك التعليمي وجدول حصصك القادمة
                    </p>
                </div>
                <Link to="/teachers-public" data-tour="student-find-teacher" className="btn-primary flex items-center gap-2 no-underline">
                    <UserIcon className="h-5 w-5" />
                    <span>ابحث عن معلم</span>
                </Link>
            </div>


            {/* Welcome Guide */}
            {/* Welcome Guide Removed - Moved to Student Home */}


            {/* Gamification XP Bar */}
            {!loadingGamification && gamificationProfile && (
                <div className="bg-gradient-to-r from-primary-gold/10 to-primary-green/10 dark:from-primary-gold/5 dark:to-primary-green/5 border border-primary-gold/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                    <div className="bg-primary-gold/20 p-4 rounded-full flex-shrink-0 relative">
                        <TrophyIcon className="h-10 w-10 text-primary-gold" />
                        <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-sm">
                            {gamificationProfile.earnedBadges.length}
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    المستوى الحالي
                                    <StarIcon className="h-5 w-5 text-amber-500 fill-amber-500" />
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">إجمالي النقاط: <span className="font-bold text-primary-gold text-lg">{gamificationProfile.totalPoints}</span> XP</p>
                            </div>

                            {gamificationProfile.nextBadgePoints > 0 && (
                                <div className="text-left">
                                    <p className="text-xs text-gray-500 mb-1">الوسام القادم: {gamificationProfile.nextBadgeName}</p>
                                    <p className="text-sm font-bold text-primary-green">{gamificationProfile.nextBadgePoints} XP</p>
                                </div>
                            )}
                        </div>

                        {gamificationProfile.nextBadgePoints > 0 ? (
                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-l from-primary-gold bg-primary-green rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(100, (gamificationProfile.totalPoints / gamificationProfile.nextBadgePoints) * 100)}%` }}
                                ></div>
                            </div>
                        ) : (
                            <div className="h-3 w-full bg-gradient-to-r from-primary-gold to-amber-300 rounded-full shadow-inner flex items-center justify-center">
                                <span className="text-[10px] text-white font-bold tracking-widest">MAX LEVEL</span>
                            </div>
                        )}

                        {gamificationProfile.earnedBadges.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-primary-gold/10 flex gap-3 overflow-x-auto pb-1">
                                {gamificationProfile.earnedBadges.map(badge => (
                                    <div key={badge.id} className="flex flex-col items-center gap-1 min-w-[60px]" title={badge.description}>
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-xl">
                                            {badge.iconUrl || '🏆'}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 truncate w-full text-center">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.name} className="card border-none shadow-sm hover:shadow-md transition-shadow flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-text-secondary mb-1">{stat.name}</p>
                            <p className="text-3xl font-bold font-latin-heading text-primary-green">{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-full ${stat.color}`}>
                            <stat.icon className="h-8 w-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Bookings List */}
            <div className="card border dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="card-header flex justify-between items-center">
                    <h3 className="card-title text-xl text-primary-green">جدول الحجوزات</h3>
                    <Link to="/student/schedule" className="text-sm text-primary-gold hover:text-primary-green-light font-medium">عرض التقويم الكامل</Link>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="spinner mx-auto mb-4 border-t-primary-gold"></div>
                            <p className="text-text-secondary">جاري تحميل بياناتك...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpenIcon className="h-10 w-10 text-text-tertiary" />
                            </div>
                            <h4 className="text-lg font-bold text-text-primary mb-2">لا توجد حجوزات نشطة</h4>
                            <p className="text-text-secondary mb-6">ابدأ رحلتك في حفظ وإتقان القرآن الكريم اليوم.</p>
                            <Link
                                to="/teachers-public"
                                className="btn-gold inline-flex items-center gap-2"
                            >
                                <UserIcon className="h-5 w-5" />
                                تصفح المعلمين المتاحين
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-border-light">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="p-6 hover:bg-bg-secondary transition-colors group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                        {/* Booking Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-lg text-text-primary group-hover:text-primary-green transition-colors">
                                                    {booking.teacherName}
                                                </h4>
                                                {getStatusBadge(booking.status)}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
                                                <span className="flex items-center gap-1.5">
                                                    <BookOpenIcon className="h-4 w-4 text-primary-gold" />
                                                    {booking.packageName}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarIcon className="h-4 w-4 text-primary-gold" />
                                                    {booking.sessionsCount} حصص
                                                </span>
                                                <span className="flex items-center gap-1.5 text-text-tertiary text-xs">
                                                    تم الحجز: {new Date(booking.createdAt).toLocaleDateString('ar-EG')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions & Price */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="font-bold text-xl font-latin-heading text-primary-green">
                                                {booking.totalPrice} <span className="text-xs font-normal text-text-secondary">{booking.currency}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                {booking.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancelClick(booking.id)}
                                                        className="text-xs text-secondary-red hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                                                    >
                                                        إلغاء الحجز
                                                    </button>
                                                )}
                                                {/* Add more actions if needed */}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                {/* Cancel Confirmation Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                    <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تأكيد الإلغاء</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟ لا يمكن تراجع عن هذا الإجراء.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        تراجع
                                    </button>
                                    <button
                                        onClick={confirmCancel}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        نعم، إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default StudentDashboard;
