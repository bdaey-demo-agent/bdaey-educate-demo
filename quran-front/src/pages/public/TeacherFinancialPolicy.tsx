import React from 'react';
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
                title="السياسة المالية للمعلمين"
                description="السياسة المالية للمعلمين في منصة بدائي: شرح كامل لنظام العمولات، المكافآت، ومواعيد السحب."
                canonical="https://bdaey.com/teacher-financial-policy"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">سياسة الأموال للمعلمين</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        توضح هذه الصفحة كيفية عمل النظام المالي، الأرباح، والمدفوعات داخل منصة بدائي.
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">كيف يتم احتساب أرباحي؟</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    عندما يقوم الطالب بحجز باقة، يتم تعليق المبلغ بالكامل في النظام. لا يتم إضافة الربح إلى محفظتك فوراً، بل يتم تقسيطه على عدد الحصص في الباقة.
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <li><strong className="text-gray-900 dark:text-white">سعر الحصة:</strong> يتم قسمة سعر الباقة على عدد الحصص.</li>
                                    <li><strong className="text-gray-900 dark:text-white">العمولة:</strong> تخصم المنصة نسبة عمولة محددة (افتراضياً أو مخصصة لك) من سعر كل حصة.</li>
                                    <li><strong className="text-gray-900 dark:text-white">صافي الربح:</strong> يضاف إلى محفظتك بعد اكتمال كل حصة بنجاح.</li>
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">متى تدخل الأموال في محفظتي؟</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    تدخل الأموال في محفظتك فوراً بمجرد اكتمال الحصة:
                                </p>
                                <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-3">
                                        <div className="h-2 w-2 mt-2 bg-blue-500 rounded-full" />
                                        <span>
                                            <strong className="text-gray-900 dark:text-white block">بعد انتهاء الجلسة:</strong>
                                            عند انتهاء وقت الحصة، قم بتحويل حالتها إلى <strong>"مكتملة" (Completed)</strong> من لوحة التحكم. سيقوم النظام فوراً بإيداع ربح الحصة في محفظتك.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="h-2 w-2 mt-2 bg-blue-500 rounded-full" />
                                        <span>
                                            <strong className="text-gray-900 dark:text-white block">نظام التقييم:</strong>
                                            يمكن للطالب تقييم الحصة في أي وقت لاحق، وسيظهر التقييم في ملفك الشخصي لزيادة فرصك في جذب طلاب جدد.
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">كيف يمكنني سحب أرباحي؟</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    حالياً، يتم سحب الأرباح عن طريق <strong>الإيداع المجمع (Bulk Deposit)</strong> الذي يقوم به المسؤول المالي بشكل دوري (مثلاً شهرياً أو أسبوعياً).
                                    <br /><br />
                                    يقوم المسؤول بمراجعة الأرصدة المستحقة للمعلمين وتحويلها أو تسليمها حسب السياسة المتبعة (تحويل بنكي، محافظ إلكترونية، إلخ)، ويتم تسجيل العملية في لوحة التحكم لتظهر في سجل معاملاتك.
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">سياسة الغياب والغرامات</h2>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    لضمان جودة التعليم والالتزام، تطبق المنصة سياسة صارمة في حال تغيب المعلم:
                                </p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li>إذا لم يحضر المعلم الحصة في موعدها (No Show)، يتم إلغاء الجلسة واسترداد الطالب لكامل المبلغ.</li>
                                    <li><strong>إلغاء الباقات النشطة:</strong> يتم فرض غرامة مالية على المعلم في حال قام بحذف أو إلغاء باقة تحتوي على حجوزات نشطة لطلاب، وذلك تعويضاً عن الضرر الناتج عن تعطيل خطة الطالب التعليمية.</li>
                                </ul>
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                                    <strong>ملاحظة:</strong> في حالة وجود ظروف قهرية، يرجى التواصل مع الإدارة قبل موعد الحصة لتجنب الغرامات.
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
