import React from 'react';
import { branding } from '../../branding';
import Seo from '../../components/common/Seo';
import {
    BanknotesIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const TeacherFinancialPolicy: React.FC = () => {
    return (
        <>
            <Seo
                title="Teacher Financial Policy"
                description={`Teacher financial policy on ${branding.nameEn}: a full explanation of commissions, bonuses, and payout schedules.`}
                canonical="https://bdaey.com/teacher-financial-policy"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Financial Policy for Teachers</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        This page explains how payments, earnings, and payouts work on {branding.nameEn}.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Section 1: Earning Calculation */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <CurrencyDollarIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How Are My Earnings Calculated?</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    When a student books a package, the full amount is held in the system. Earnings are not added to your wallet immediately; they are released per session across the package.
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <li><strong className="text-gray-900 dark:text-white">Session price:</strong> the package price divided by the number of sessions.</li>
                                    <li><strong className="text-gray-900 dark:text-white">Commission:</strong> the platform deducts a set commission rate (default or custom for you) from each session price.</li>
                                    <li><strong className="text-gray-900 dark:text-white">Net earnings:</strong> added to your wallet after each session is completed successfully.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Release of Funds */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <ClockIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">When Do Funds Reach My Wallet?</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    Funds reach your wallet as soon as a session is completed:
                                </p>
                                <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-3">
                                        <div className="h-2 w-2 mt-2 bg-blue-500 rounded-full" />
                                        <span>
                                            <strong className="text-gray-900 dark:text-white block">After the session ends:</strong>
                                            When the session time ends, mark it as <strong>"Completed"</strong> from your dashboard. The system immediately deposits the session earnings into your wallet.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-2 w-2 mt-2 bg-blue-500 rounded-full" />
                                        <span>
                                            <strong className="text-gray-900 dark:text-white block">Rating system:</strong>
                                            The student can rate the session at any later time, and the rating appears on your profile to help attract new students.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Withdrawal */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <BanknotesIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How Do I Withdraw My Earnings?</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Currently, earnings are withdrawn via a <strong>bulk payout</strong> performed by the financial administrator on a regular cycle (for example monthly or weekly).
                                    <br /><br />
                                    The administrator reviews teacher balances and transfers or delivers them according to the adopted policy (bank transfer, mobile wallets, etc.), and the transaction is recorded in the dashboard so it appears in your transaction history.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Penalties */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-red-100 dark:border-red-900/30 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <ExclamationTriangleIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Absence and Penalty Policy</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    To ensure teaching quality and commitment, the platform applies a strict policy when a teacher is absent:
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li>If the teacher misses the session (no-show), the session is cancelled and the student receives a full refund.</li>
                                    <li><strong>Cancelling active packages:</strong> a financial penalty applies if a teacher deletes or cancels a package that has active student bookings, as compensation for disrupting the student's learning plan.</li>
                                </ul>
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                                    <strong>Note:</strong> in case of force majeure, please contact the administration before the session time to avoid penalties.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default TeacherFinancialPolicy;
