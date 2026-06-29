import React from 'react';
import {
    CurrencyDollarIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const StudentRefundPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">سياسة استرجاع الأموال للطلاب</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        حقوقك في استرداد الرسوم في حال إلغاء الحصص أو حدوث مشاكل تقنية.
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">شروط إلغاء الحجز</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    يمكنك إلغاء طلب الحجز في أي وقت **قبل موافقة المعلم عليه** (عندما تكون الحالة "قيد الانتظار").
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li><strong className="text-gray-900 dark:text-white">قبل الموافقة:</strong> استرداد كامل وتلقائي للمبلغ إلى محفظتك.</li>
                                    <li><strong className="text-gray-900 dark:text-white">بعد الموافقة:</strong> لا يمكن إلغاء الحجز من طرف الطالب إلا بالتواصل مع الدعم الفني أو المعلم، وقد تطبق سياسات خاصة.</li>
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">غياب المعلم (No Show)</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    نلتزم بحفظ حقك ووقتك. في حال تغيب المعلم عن موعد الحصة المحدد:
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li>يتم إلغاء الجلسة تلقائياً أو يدوياً من قبل الإدارة.</li>
                                    <li>يتم <strong>استرداد كامل المبلغ</strong> وإضافته إلى رصيد محفظتك فوراً.</li>
                                    <li>يمكنك استخدام الرصيد لحجز حصة أخرى مع نفس المعلم أو معلم آخر.</li>
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">مشاكل تقنية</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    في حال حدوث مشكلة تقنية من جانب المنصة منعت عقد الجلسة، يرجى التواصل مع الدعم الفني فوراً. سيتم التحقق من المشكلة وتعويضك بإعادة جدولة الجلسة أو استرداد المبلغ كاملاً.
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">آلية الاسترداد</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    يتم إعادة المبالغ المستردة كرصيد في <strong>المحفظة الإلكترونية</strong> الخاصة بك في المنصة. يمكنك استخدام هذا الرصيد لدفع رسوم باقات أو حصص جديدة في أي وقت.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRefundPolicy;
