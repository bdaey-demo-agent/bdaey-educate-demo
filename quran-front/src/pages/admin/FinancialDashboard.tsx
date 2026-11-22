import React, { useState, useEffect } from 'react';
import type {
    Transaction,
    TransactionFilter,
    FinancialSummary
} from '../../services/walletService';
import walletService from '../../services/walletService';
import BulkDepositModal from '../../components/dashboard/BulkDepositModal';
import StudentBulkDepositModal from '../../components/dashboard/StudentBulkDepositModal';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    AcademicCapIcon,
    PlusIcon,
    UserGroupIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';
// Removed Dialog as it is now unused in this file directly

const FinancialDashboard: React.FC = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [summary, setSummary] = useState<FinancialSummary>({
        totalDeposits: 0,
        totalManualDeposits: 0,
        totalCouponDeposits: 0,
        totalPayments: 0,
        totalRefunds: 0,
        netFlow: 0,
        platformProfit: 0
    });

    // Deposit Modal State
    // Deposit Modal State
    const [isBulkDepositOpen, setIsBulkDepositOpen] = useState(false); // Teachers
    const [isStudentBulkDepositOpen, setIsStudentBulkDepositOpen] = useState(false); // Students

    // Filters
    const [filter, setFilter] = useState<TransactionFilter>({
        page: 1,
        pageSize: 10, // Default page size
        searchQuery: '',
        status: '',
        provider: '',
        from: '',
        to: ''
    });

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [filter]); // Re-fetch when filter changes

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Transactions
            const txResult = await walletService.getAdminTransactions(filter);
            setTransactions(txResult.items);
            setTotalCount(txResult.totalCount);

            // Fetch Summary (only if dates change or initial load)
            const summaryResult = await walletService.getAdminSummary(filter.from, filter.to);
            setSummary(summaryResult);

        } catch (error) {
            console.error(error);
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
        setFilter(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to page 1 on filter change
        }));
    };

    const handlePageChange = (newPage: number) => {
        setFilter(prev => ({ ...prev, page: newPage }));
    };



    const formatCurrency = (amount: number, currency: string = 'EGP') => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency }).format(amount);
    };

    // statusColors removed in favor of utils

    return (
        <div className="p-6 space-y-8 animate-fadeIn">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Financial Dashboard</h1>
                    <p className="text-gray-500">Track financial operations and revenue</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsBulkDepositOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        <UserGroupIcon className="w-5 h-5" />
                        <span>Teacher Deposit</span>
                    </button>
                    <button
                        onClick={() => setIsStudentBulkDepositOpen(true)}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        <AcademicCapIcon className="w-5 h-5" />
                        <span>Student Deposit</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <StatCard
                    title="Deposits (external)"
                    value={formatCurrency(summary.totalDeposits)}
                    icon={<ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />}
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="Coupon Deposits"
                    value={formatCurrency(summary.totalCouponDeposits)}
                    icon={<TagIcon className="w-6 h-6 text-indigo-600" />}
                    bgColor="bg-indigo-50"
                />
                <StatCard
                    title="Manual Deposits (admin)"
                    value={formatCurrency(summary.totalManualDeposits)}
                    icon={<PlusIcon className="w-6 h-6 text-blue-600" />}
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Platform Revenue"
                    value={formatCurrency(summary.platformProfit)}
                    icon={<BanknotesIcon className="w-6 h-6 text-gold-500" />}
                    bgColor="bg-yellow-50"
                />
                <StatCard
                    title="Payments (spending)"
                    value={formatCurrency(summary.totalPayments)}
                    icon={<BanknotesIcon className="w-6 h-6 text-gray-600" />}
                    bgColor="bg-gray-50"
                />
                <StatCard
                    title="Refunds"
                    value={formatCurrency(summary.totalRefunds)}
                    icon={<ClockIcon className="w-6 h-6 text-orange-600" />}
                    bgColor="bg-orange-50"
                />
                <StatCard
                    title="Net Flow"
                    value={formatCurrency(summary.netFlow)}
                    icon={<ArrowTrendingDownIcon className="w-6 h-6 text-purple-600" />}
                    bgColor="bg-purple-50"
                    isNet
                />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 md:flex-wrap">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search by user name or email..."
                        className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-gold-500"
                        value={filter.searchQuery}
                        onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    />
                </div>

                {/* Status */}
                <select
                    className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={filter.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="Succeeded">Succeeded</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                </select>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={filter.from?.split('T')[0] || ''}
                        onChange={(e) => handleFilterChange('from', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={filter.to?.split('T')[0] || ''}
                        onChange={(e) => handleFilterChange('to', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance (after)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transactions</td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 dir-ltr text-right">
                                            {new Date(t.createdAt).toLocaleDateString('ar-EG')} <br />
                                            <span className="text-xs">{new Date(t.createdAt).toLocaleTimeString('ar-EG')}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{t.user.fullName}</div>
                                            <div className="text-xs text-gray-500">{t.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {translateType(t.type)}
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]" title={t.description}>{t.description}</div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'} dir-ltr text-right`}>
                                            {formatCurrency(t.amount, t.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(t.status)}`}>
                                                {translateStatus(t.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {t.provider || '-'}
                                            {t.providerTransactionId && (
                                                <div className="text-xs font-mono text-gray-400" title={t.providerTransactionId}>
                                                    {t.providerTransactionId.substring(0, 8)}...
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dir-ltr text-right">
                                            {formatCurrency(t.balanceAfter, t.currency)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Showing <span className="font-medium">{(filter.page - 1) * filter.pageSize + 1}</span> to <span className="font-medium">{Math.min(filter.page * filter.pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, filter.page - 1))}
                                    disabled={filter.page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(filter.page + 1)}
                                    disabled={filter.page * filter.pageSize >= totalCount}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Deposit Modal */}
            <BulkDepositModal
                isOpen={isBulkDepositOpen}
                onClose={() => setIsBulkDepositOpen(false)}
                onSuccess={() => {
                    toast.success('Bulk deposit completed');
                    fetchData();
                }}
            />

            {/* Student Bulk Deposit Modal */}
            <StudentBulkDepositModal
                isOpen={isStudentBulkDepositOpen}
                onClose={() => setIsStudentBulkDepositOpen(false)}
                onSuccess={() => {
                    toast.success('Student deposit completed');
                    fetchData();
                }}
            />
        </div>
    );
};

// Helper Components & Functions
const StatCard = ({ title, value, icon, bgColor, isNet = false }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${isNet ? 'text-gray-900 dark:text-white' : ''} dir-ltr`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
            {icon}
        </div>
    </div>
);

const translateType = (type: string) => {
    const map: Record<string, string> = {
        'Deposit': 'Deposit',
        'Withdrawal': 'Withdrawal',
        'Payment': 'Payment',
        'Refund': 'Refund',
        'Income': 'Income'
    };
    return map[type] || type;
};

export default FinancialDashboard;
