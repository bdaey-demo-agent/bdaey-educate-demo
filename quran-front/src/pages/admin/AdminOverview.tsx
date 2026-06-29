import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { type AdminStats } from '../../types/adminTypes';
import { toast } from 'react-hot-toast';
import {
    ChartPieIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    SignalIcon,
    UserIcon,
    BanknotesIcon,
    XCircleIcon,
    PlayCircleIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const AdminOverview = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminService.getStats();
            setStats(data);
        } catch (error) {
            console.error(error);
            toast.error('فشل في تحميل الإحصائيات');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center dark:text-white">جاري تحميل الإحصائيات...</div>;
    if (!stats) return <div className="p-8 text-center dark:text-white">لا توجد إحصائيات متاحة</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">نظرة عامة</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            <UserGroupIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">إجمالي المستخدمين</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
                            <SignalIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">المستخدمون النشطون الآن</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsersCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                            <UserIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">الطلاب</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                            <AcademicCapIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">المعلمين</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.totalTeachers} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({stats.pendingTeachers} بانتظار الموافقة)</span>
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                            <CurrencyDollarIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">إجمالي المعاملات</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVolume.toLocaleString()} EGP</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                            <BanknotesIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">طلبات السحب المعلقة</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.pendingWithdrawals} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({stats.pendingWithdrawalsAmount.toLocaleString()} EGP)</span>
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full">
                            <XCircleIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">الحجوزات الملغية</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelledBookings}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                            <ChartPieIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">الحجوزات</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.totalBookings} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({stats.completedBookings} مكتملة)</span>
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full">
                            <PlayCircleIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">الجلسات المكتملة</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedSessions}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                            <ArrowTrendingUpIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">مستخدمين جدد (7 أيام)</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newUsersLast7Days}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Can add Charts here later */}
        </div>
    );
};

export default AdminOverview;
