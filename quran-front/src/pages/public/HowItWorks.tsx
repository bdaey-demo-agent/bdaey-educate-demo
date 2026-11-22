import React, { useState } from 'react';
import { branding } from '../../branding';
import Seo from '../../components/common/Seo';
import {
    UserIcon,
    AcademicCapIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    VideoCameraIcon,
    CreditCardIcon,
    CheckBadgeIcon,
    DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const HowItWorks: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');

    return (
        <>
            <Seo
                title={`كيف تعمل منصة ${branding.nameAr}`}
                description={`تعرف على كيفية عمل منصة ${branding.nameAr}: ابحث عن معلم، اختر باقة، احجز جلسات، وابدأ رحلتك في تعلم القرآن الكريم.`}
                canonical="https://bdaey.com/how-it-works"
            />
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white transition-colors duration-300 font-body" dir="rtl">

            {/* Header / Hero */}
            <div className="bg-primary-green dark:bg-slate-900 text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold font-heading mb-4 text-white">كيف تعمل منصة <span className="text-gold">{branding.nameAr}</span>؟</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90">دليلك الكامل لرحلة تعليمية ميسرة، سواء كنت طالباً تبحث عن العلم أو معلماً يسعى لنشره.</p>
                </div>
            </div>

            {/* Toggle Switch */}
            <div className="container mx-auto px-4 -mt-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg max-w-lg mx-auto p-2 flex">
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'student'
                            ? 'bg-primary-green text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400'
                            }`}
                    >
                        <UserIcon className="w-6 h-6" />
                        كطالب
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'teacher'
                            ? 'bg-primary-green text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400'
                            }`}
                    >
                        <AcademicCapIcon className="w-6 h-6" />
                        كمعلم
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">

                {activeTab === 'student' ? (
                    <div className="space-y-12 animate-fadeIn">
                        {/* Step 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 text-primary-green flex items-center justify-center text-3xl font-bold shrink-0">1</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">سجّل حسابك في ثوانٍ</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    أنشئ حساباً مجانياً كطالب. لا نحتاج سوى اسمك وبريدك الإلكتروني لتبدأ رحلتك.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <UserIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-3xl font-bold shrink-0">2</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">ابحث عن معلمك المثالي</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    استخدم الفلاتر للبحث حسب المادة (تجويد، حفظ، قراءات)، السعر، أو التقييم. شاهد الملفات الشخصية للمعلمين وتعرف على خبراتهم.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <MagnifyingGlassIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple flex items-center justify-center text-3xl font-bold shrink-0">3</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">احجز وجدول حصصك</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    اختر باقة تناسبك واحجز المواعيد المتاحة في جدول المعلم. النظام يرسل لك تنبيهات قبل الموعد.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CalendarIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 flex items-center justify-center text-3xl font-bold shrink-0">4</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">ابدأ التعلم المباشر</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    عند موعد الحصة، ادخل للقاعة الافتراضية بنقرة واحدة. تواصل بالصوت والفيديو بجودة عالية وابدأ القراءة.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <VideoCameraIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link to="/register/student" className="btn-gold px-12 py-4 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                سجّل الآن كطالب
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 animate-fadeIn">
                        {/* Teacher Step 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-gold/20 text-gold-600 dark:text-gold-400 flex items-center justify-center text-3xl font-bold shrink-0">1</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">قدّم طلب الانضمام</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    أنشئ حساب معلم واملأ ملفك الشخصي. ارفع شهاداتك (الإجازات، المؤهلات).
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <DocumentCheckIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Teacher Step 2 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center text-3xl font-bold shrink-0">2</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">المراجعة والاعتماد</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    فريق الجودة يراجع بياناتك للتأكد من أهليتك. عند الموافقة، سيتم تفعيل حسابك للظهور للطلاب.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CheckBadgeIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Teacher Step 3 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-3xl font-bold shrink-0">3</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">حدّد جدولك وباقاتك</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    أنت مدير نفسك. حدد الأوقات التي تكون فيها متاحاً، وأسعار الحصص، وأنواع الباقات التي تقدمها.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CalendarIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Teacher Step 4 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple flex items-center justify-center text-3xl font-bold shrink-0">4</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">استقبل الطلاب والأرباح</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    ابدأ في استقبال الحجوزات. قدّم دروسك بتميز، واحصل على أرباحك دورياً عبر محفظتك الإلكترونية.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CreditCardIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link to="/register/teacher" className="btn-gold px-12 py-4 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                انضم كمعلم الآن
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default HowItWorks;
