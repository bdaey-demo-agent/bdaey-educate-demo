import React from 'react';
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">دليل استخدام لوحة المسؤول</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        دليلك الشامل لإدارة منصة بدائي، التحكم في المعلمين، ومتابعة العمليات المالية.
                    </p>
                </div>

                {/* Section 1: Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <ChartPieIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">نظرة عامة</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                توفر لك لوحة "نظرة عامة" إحصائيات سريعة عن أداء المنصة:
                            </p>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                <li><strong className="text-gray-900 dark:text-white">إجمالي المستخدمين:</strong> عدد الطلاب والمعلمين المسجلين.</li>
                                <li><strong className="text-gray-900 dark:text-white">المعلمون:</strong> العدد الكلي للمعلمين، مع تمييز المعلمين "في الانتظار" الذين يحتاجون للمراجعة.</li>
                                <li><strong className="text-gray-900 dark:text-white">حجم التداول:</strong> إجمالي المبالغ المالية التي تم دفعها عبر المنصة.</li>
                                <li><strong className="text-gray-900 dark:text-white">الحجوزات:</strong> عدد الحجوزات النشطة والمكتملة.</li>
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">إدارة المعلمين</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                يمكنك التحكم الكامل في حسابات المعلمين من تبويب "المعلمون":
                            </p>
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                                        قبول المعلمين
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        المعلمون الجدد يظهرون بحالة "في الانتظار". يمكنك استعراض مستنداتهم (الهوية، الشهادات) بالضغط على أيقونة "التفاصيل"، ثم قبولهم أو رفضهم.
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                        <CurrencyDollarIcon className="h-5 w-5 text-gold-500" />
                                        تخصيص العمولات
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        يمكنك تحديد نسبة عمولة خاصة لمعلم معين تختلف عن النسبة العامة للمنصة. اضغط على "تعديل النسبة" بجانب اسم المعلم لتحديثها.
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">الإدارة المالية</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                توفر "لوحة التحكم المالية" أدوات متكاملة لإدارة تدفق الأموال في المنصة:
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">1. الإيداع المجمع</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        بدلاً من الإيداع اليدوي لكل مستخدم، يمكنك الآن استخدام أدوات الإيداع المجمع:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li><strong className="text-blue-600">إيداع معلمين:</strong> اختر المعلمين المستحقين، حدد المبلغ (مكافأة، راتب ثابت)، وسيتم الإيداع في محافظهم دفعة واحدة.</li>
                                        <li><strong className="text-teal-600">إيداع طلاب:</strong> (جديد) يمكنك تحديد طلاب معينين أو كل الطلاب لإيداع رصيد ترويجي أو تعويضات.</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">2. إدارة العمولات</h3>
                                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <li><strong className="text-gray-900 dark:text-white">النسبة العامة:</strong> من "الإعدادات"، يمكنك تحديد النسبة الافتراضية التي تخصمها المنصة من كل حصة.</li>
                                        <li><strong className="text-gray-900 dark:text-white">نسبة خاصة:</strong> من "صفحة المعلمين"، يمكنك تحديد نسبة مخفضة أو مختلفة لمعلمين مميزين.</li>
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">الطلاب والدعم</h2>
                            <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                                <li>
                                    <strong className="text-gray-900 dark:text-white block mb-1">الطلاب:</strong>
                                    استعراض قائمة الطلاب، حالة الحساب (نشط/محظور)، وتاريخ الانضمام.
                                </li>
                                <li>
                                    <strong className="text-gray-900 dark:text-white block mb-1">الرسائل (الدعم):</strong>
                                    متابعة تذاكر الدعم الفني ورسائل "تواصل معنا" والرد عليها.
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
