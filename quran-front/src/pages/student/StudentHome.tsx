import React from 'react';
import { useAuth } from '../../context/AuthContext';
import OnboardingGuide, { type OnboardingStep } from '../../components/common/OnboardingGuide';
import {
    MagnifyingGlassIcon,
    WalletIcon,
    CalendarDaysIcon,
    VideoCameraIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface StudentHomeProps {
    demoMode?: boolean;
}

const StudentHome: React.FC<StudentHomeProps> = ({ demoMode = false }) => {
    const { user: authUser } = useAuth();

    // Mock user for demo mode
    const user = demoMode ? {
        fullName: 'عبدالله محمد',
        role: 'Student'
    } : authUser;

    // We can reuse the steps logic or fetch real status here if needed.
    // For now purely presentational as "Welcome".
    const studentSteps: OnboardingStep[] = [
        {
            id: 1,
            title: 'ابحث عن معلمك',
            description: 'تصفح قائمة المعلمين المؤهلين واختر الأنسب لك بناءً على التقييمات والخبرات.',
            icon: MagnifyingGlassIcon,
            linkTo: '/teachers-public',
            linkText: 'تصفح المعلمين',
            isCompleted: false
        },
        {
            id: 2,
            title: 'اشحن محفظتك',
            description: 'أضف رصيداً إلى محفظتك الإلكترونية لتتمكن من حجز الباقات.',
            icon: WalletIcon,
            linkTo: '/student/wallet',
            linkText: 'اذهب للمحفظة',
            isCompleted: false
        },
        {
            id: 3,
            title: 'احجز باقتك الأولى',
            description: 'اختر باقة تناسب جدولك وابدأ رحلتك التعليمية.',
            icon: CalendarDaysIcon,
            linkTo: '/teachers-public',
            linkText: 'احجز الآن',
            isCompleted: false
        },
        {
            id: 4,
            title: 'احضر جلستك',
            description: 'تابع جدول حصصك وادخل الجلسة في موعدها المحدد.',
            icon: VideoCameraIcon,
            linkTo: '/student/schedule',
            linkText: 'جدول الحصص',
            isCompleted: false
        }
    ];

    return (
        <div className="animate-fade-in font-body">
            {/* Hero Welcome */}
            <div className="bg-gradient-to-r from-primary-green to-emerald-800 rounded-3xl p-10 text-white mb-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-bold font-heading mb-4">
                        أهلاً بك، {user?.fullName} 👋
                    </h1>
                    <p className="text-xl text-emerald-50 leading-relaxed mb-8">
                        نحن سعداء بوجودك معنا في منصة بدائي. هذه صفحتك الرئيسية حيث يمكنك الانطلاق في رحلتك لتعلم القرآن الكريم.
                    </p>
                    <div className="flex gap-4">
                        <Link id="btn-get-started" to="/teachers-public" className="btn-gold px-8 py-3 font-bold text-gray-900 shadow-md transform hover:-translate-y-1 transition-transform">
                            ابدأ رحلتك
                        </Link>
                        <Link to="/student/dashboard" className="btn-outline border-white text-white hover:bg-white hover:text-emerald-900 px-8 py-3 font-bold">
                            لوحة التحكم
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Introduction */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">ابدأ من هنا</h2>
                <OnboardingGuide
                    title="دليلك السريع"
                    subtitle="خطوات بسيطة للانطلاق"
                    role="Student"
                    steps={studentSteps}
                />
            </div>
        </div>
    );
};

export default StudentHome;
