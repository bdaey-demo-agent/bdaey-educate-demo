import React from 'react';
import { branding } from '../../branding';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import OnboardingGuide, { type OnboardingStep } from '../../components/common/OnboardingGuide';
import {
    UserCircleIcon,
    CheckCircleIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import teacherService from '../../services/teacherService';
import packagesService from '../../services/packagesService';

const TeacherHome: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [myPackages, setMyPackages] = useState<any[]>([]);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const profileData = await teacherService.getMyProfile();
                setProfile(profileData);
                if (profileData?.id) {
                    const packagesData = await packagesService.getTeacherPackages(profileData.id);
                    setMyPackages(packagesData || []);
                }
            } catch (error) {
                console.error("Error fetching teacher home data:", error);
            }
        };

        fetchTeacherData();
    }, []);

    const status = profile?.status || 'Pending';
    const hasPackages = myPackages.length > 0;

    const teacherSteps: OnboardingStep[] = [
        {
            id: 1,
            title: 'أكمل ملفك الشخصي',
            description: 'أضف معلوماتك ومؤهلاتك وفيديو تعريفي ليتمكن الطلاب من التعرف عليك.',
            icon: UserCircleIcon,
            linkTo: '/teacher/profile',
            isCompleted: status !== 'Pending'
        },
        {
            id: 2,
            title: 'انتظر الموافقة',
            description: 'سيقوم فريق المشرفين بمراجعة ملفك وتفعيله في أقرب وقت.',
            icon: CheckCircleIcon,
            isCompleted: status === 'Approved'
        },
        {
            id: 3,
            title: 'أنشئ باقاتك',
            description: 'حدد الأسعار والباقات التي ترغب في تقديمها للطلاب.',
            icon: BanknotesIcon,
            linkTo: '/teacher/packages',
            isCompleted: hasPackages
        },
    ];

    return (
        <div className="animate-fade-in font-body">
            {/* Hero Welcome */}
            <div className="bg-gradient-to-r from-secondary-blue to-blue-900 rounded-3xl p-10 text-white mb-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-bold font-heading mb-4">
                        أهلاً بك يا معلم، {user?.fullName} 👋
                    </h1>
                    <p className="text-xl text-blue-50 leading-relaxed mb-8">
                        شكراً لانضمامك إلى كوكبة معلمي {branding.nameAr}. هنا نقطة انطلاقك لنشر العلم وتحفيظ كتاب الله.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/teacher/profile" className="btn-gold px-8 py-3 font-bold text-gray-900 shadow-md transform hover:-translate-y-1 transition-transform">
                            أكمل ملفك
                        </Link>
                        <Link to="/teacher/dashboard" className="btn-outline border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 font-bold">
                            لوحة التحكم
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">خطواتك الأولى</h2>
                <OnboardingGuide
                    title="رحلة المعلم"
                    subtitle="خطوات الانضمام والبدء"
                    role="Teacher"
                    steps={teacherSteps}
                />
            </div>
        </div>
    );
};

export default TeacherHome;
