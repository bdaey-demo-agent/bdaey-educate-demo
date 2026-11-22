import React from 'react';
import { branding } from '../../branding';
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
        fullName: 'Abdullah Mohamed',
        role: 'Student'
    } : authUser;

    // We can reuse the steps logic or fetch real status here if needed.
    // For now purely presentational as "Welcome".
    const studentSteps: OnboardingStep[] = [
        {
            id: 1,
            title: 'Find Your Teacher',
            description: 'Browse qualified teachers and pick the best fit based on ratings and experience.',
            icon: MagnifyingGlassIcon,
            linkTo: '/teachers-public',
            linkText: 'Browse Teachers',
            isCompleted: false
        },
        {
            id: 2,
            title: 'Top Up Your Wallet',
            description: 'Add credit to your digital wallet so you can book packages.',
            icon: WalletIcon,
            linkTo: '/student/wallet',
            linkText: 'Go to Wallet',
            isCompleted: false
        },
        {
            id: 3,
            title: 'Book Your First Package',
            description: 'Choose a package that fits your schedule and start your learning journey.',
            icon: CalendarDaysIcon,
            linkTo: '/teachers-public',
            linkText: 'Book Now',
            isCompleted: false
        },
        {
            id: 4,
            title: 'Attend Your Session',
            description: 'Follow your session schedule and join the session on time.',
            icon: VideoCameraIcon,
            linkTo: '/student/schedule',
            linkText: 'Session Schedule',
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
                        Welcome, {user?.fullName} 👋
                    </h1>
                    <p className="text-xl text-emerald-50 leading-relaxed mb-8">
                        We are glad to have you on {branding.nameEn}. This is your home page, where your Quran learning journey begins.
                    </p>
                    <div className="flex gap-4">
                        <Link id="btn-get-started" to="/teachers-public" className="btn-gold px-8 py-3 font-bold text-gray-900 shadow-md transform hover:-translate-y-1 transition-transform">
                            Start Your Journey
                        </Link>
                        <Link to="/student/dashboard" className="btn-outline border-white text-white hover:bg-white hover:text-emerald-900 px-8 py-3 font-bold">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Introduction */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Start Here</h2>
                <OnboardingGuide
                    title="Your Quick Guide"
                    subtitle="Simple steps to get going"
                    role="Student"
                    steps={studentSteps}
                />
            </div>
        </div>
    );
};

export default StudentHome;
