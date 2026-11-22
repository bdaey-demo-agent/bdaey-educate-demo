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
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    StarIcon,
    WalletIcon,
    Squares2X2Icon,
    UserPlusIcon,
    ClockIcon
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
            toast.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center dark:text-white">Loading statistics...</div>;
    if (!stats) return <div className="p-8 text-center dark:text-white">No statistics available</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            <UserGroupIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Users</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Active Users Now</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Students</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Teachers</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.totalTeachers} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({stats.pendingTeachers} pending approval)</span>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Transactions</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Pending Withdrawals</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Cancelled Bookings</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Bookings</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.totalBookings} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({stats.completedBookings} completed)</span>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Completed Sessions</p>
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
                            <p className="text-gray-500 dark:text-gray-400 text-sm">New Users (7 days)</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newUsersLast7Days}</h3>
                        </div>
                    </div>
                </div>

                {/* --- 6 New Cards --- */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full">
                            <CalendarDaysIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Sessions</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full">
                            <ClockIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Upcoming Sessions</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingSessions}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                            <StarIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Average Rating</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5</span></h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">
                            <WalletIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Wallet Balances</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWalletBalance.toLocaleString()} EGP</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-full">
                            <Squares2X2Icon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Active Packages</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePackages}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full">
                            <UserPlusIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">New Users Today</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newUsersToday}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
