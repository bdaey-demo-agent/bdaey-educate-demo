import React from 'react';
import { branding } from '../../branding';
import Seo from '../../components/common/Seo';
import {
    CurrencyDollarIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const StudentRefundPolicy: React.FC = () => {
    return (
        <>
            <Seo
                title="Refund Policy"
                description={`Refund and cancellation policy on ${branding.nameEn}: a full explanation of how session and subscription refunds work.`}
                canonical="https://bdaey.com/refund-policy"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Refund Policy for Students</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Your rights to a refund when sessions are cancelled or technical problems occur.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Section 1: Cancellation Rules */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <ClockIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Booking Cancellation Terms</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    You can cancel a booking request at any time **before the teacher approves it** (while the status is "Pending").
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li><strong className="text-gray-900 dark:text-white">Before approval:</strong> full, automatic refund to your wallet.</li>
                                    <li><strong className="text-gray-900 dark:text-white">After approval:</strong> a student can only cancel by contacting support or the teacher, and special policies may apply.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Teacher Absence */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                <ExclamationTriangleIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Teacher No-Show</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    We are committed to protecting your rights and your time. If the teacher misses the scheduled session:
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li>The session is cancelled automatically or manually by the administration.</li>
                                    <li>The <strong>full amount is refunded</strong> to your wallet balance immediately.</li>
                                    <li>You can use the balance to book another session with the same teacher or a different one.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Technical Issues */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <CheckCircleIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Technical Issues</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    If a platform-side technical issue prevents the session from taking place, please contact support immediately. We will investigate and compensate you by rescheduling the session or refunding the full amount.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Refunds Method */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <CurrencyDollarIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How Refunds Work</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Refunded amounts are returned as credit to your <strong>digital wallet</strong> on the platform. You can use this credit to pay for new packages or sessions at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default StudentRefundPolicy;
