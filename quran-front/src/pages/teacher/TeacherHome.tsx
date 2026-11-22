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
            title: 'Complete Your Profile',
            description: 'Add your information, qualifications, and an intro video so students can get to know you.',
            icon: UserCircleIcon,
            linkTo: '/teacher/profile',
            isCompleted: status !== 'Pending'
        },
        {
            id: 2,
            title: 'Wait for Approval',
            description: 'Our review team will check your profile and activate it shortly.',
            icon: CheckCircleIcon,
            isCompleted: status === 'Approved'
        },
        {
            id: 3,
            title: 'Create Your Packages',
            description: 'Set the prices and packages you want to offer students.',
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
                        Welcome, teacher {user?.fullName} 👋
                    </h1>
                    <p className="text-xl text-blue-50 leading-relaxed mb-8">
                        Thank you for joining the {branding.nameEn} teaching team. This is your launchpad for spreading knowledge and teaching the Quran.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/teacher/profile" className="btn-gold px-8 py-3 font-bold text-gray-900 shadow-md transform hover:-translate-y-1 transition-transform">
                            Complete Your Profile
                        </Link>
                        <Link to="/teacher/dashboard" className="btn-outline border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 font-bold">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Your First Steps</h2>
                <OnboardingGuide
                    title="The Teacher Journey"
                    subtitle="Steps to join and get started"
                    role="Teacher"
                    steps={teacherSteps}
                />
            </div>
        </div>
    );
};

export default TeacherHome;
