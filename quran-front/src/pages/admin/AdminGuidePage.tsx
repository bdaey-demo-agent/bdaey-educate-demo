import React from 'react';
import { branding } from '../../branding';
import {
    ChartPieIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

const AdminGuidePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Admin Panel Guide</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Your complete guide to managing {branding.nameEn}: controlling teachers and tracking finances.
                    </p>
                </div>

                {/* Section 1: Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <ChartPieIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Overview</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                The Overview tab gives you quick stats on platform performance:
                            </p>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                <li><strong className="text-gray-900 dark:text-white">Total users:</strong> registered students and teachers.</li>
                                <li><strong className="text-gray-900 dark:text-white">Teachers:</strong> total teacher count, highlighting pending teachers who need review.</li>
                                <li><strong className="text-gray-900 dark:text-white">Transaction volume:</strong> total money paid through the platform.</li>
                                <li><strong className="text-gray-900 dark:text-white">Bookings:</strong> active and completed booking counts.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 2: Teacher Management */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <AcademicCapIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Teacher Management</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                You have full control over teacher accounts from the Teachers tab:
                            </p>
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                                        Approving Teachers
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        New teachers appear as "Pending". Review their documents (ID, certificates) via the details icon, then approve or reject them.
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <CurrencyDollarIcon className="h-5 w-5 text-gold-500" />
                                        Custom Commissions
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        You can set a custom commission rate for a specific teacher, different from the platform default. Click "Edit Rate" next to the teacher's name to update it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Financial Management */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <CurrencyDollarIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Financial Management</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                The Financial Dashboard provides complete tools for managing money flow on the platform:
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">1. Bulk Deposits</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Instead of depositing manually per user, you can use the bulk deposit tools:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li><strong className="text-blue-600">Teacher deposit:</strong> select eligible teachers, set the amount (bonus, fixed salary), and it is deposited into their wallets at once.</li>
                                        <li><strong className="text-teal-600">Student deposit:</strong> (new) select specific students or all students to deposit promotional credit or compensation.</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">2. Commission Management</h3>
                                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <li><strong className="text-gray-900 dark:text-white">Default rate:</strong> in Settings, set the default percentage the platform deducts per session.</li>
                                        <li><strong className="text-gray-900 dark:text-white">Custom rate:</strong> on the Teachers page, set a reduced or different rate for select teachers.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Users & Support */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <UserGroupIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Students and Support</h2>
                            <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                                <li>
                                    <strong className="text-gray-900 dark:text-white block mb-1">Students:</strong>
                                    Browse the student list, account status (active/blocked), and join dates.
                                </li>
                                <li>
                                    <strong className="text-gray-900 dark:text-white block mb-1">Messages (support):</strong>
                                    Track support tickets and Contact Us messages and reply to them.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGuidePage;
