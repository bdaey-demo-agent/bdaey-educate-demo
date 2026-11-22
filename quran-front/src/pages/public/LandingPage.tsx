import React from 'react';
import { branding } from '../../branding';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Seo, { OrganizationSchema } from '../../components/common/Seo';
import {
    CalendarDaysIcon,
    CheckBadgeIcon,
    VideoCameraIcon,
    ShieldCheckIcon,
    SparklesIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    UserIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';


const LandingPage: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuth();


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isAuthenticated && user) {
        if (user.role === 'Student') return <Navigate to="/student/dashboard" replace />;
        if (user.role === 'Teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'Admin') return <Navigate to="/admin/overview" replace />;
    }

    return (
        <>
            <Seo
                title={`${branding.nameEn} - Online Quran Memorization Platform`}
                description={`${branding.nameEn}: learn Quran, Tajweed and the Ten Qiraat with certified, Ijazah-holding teachers. Live one-on-one sessions, flexible scheduling, and competitive prices.`}
                canonical="https://bdaey.com"
            />
            <OrganizationSchema />
            <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
            {/* HERO */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent" />
                    {/* If you have a landing-hero background image in CSS keep it, otherwise this works without one */}
                    <div className="landing-hero h-full w-full" />
                </div>

                <div className="relative container mx-auto px-4 py-20 md:py-28">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/20">
                            <CheckBadgeIcon className="h-4 w-4" />
                            Certified teachers • Live sessions • Secure wallet
                        </span>

                        <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight text-white">
                            <span className="text-gold">{branding.nameEn}</span> Quran Learning Platform
                        </h1>

                        <p className="mt-5 text-lg md:text-xl text-white/90 leading-relaxed">
                            Learn with Ijazah-holding teachers in live one-on-one sessions, with flexible scheduling and a plan that fits your level.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/register/student"
                                data-tour="cta-register-student"
                                className="w-full sm:w-auto rounded-xl bg-gold px-7 py-3 text-base font-semibold text-gray-900 hover:opacity-95 transition"
                            >
                                Start as a Student
                            </Link>
                            <Link
                                to="/teachers-public"
                                data-tour="cta-browse-teachers"
                                className="w-full sm:w-auto rounded-xl bg-white/10 px-7 py-3 text-base font-semibold text-white ring-1 ring-white/25 hover:bg-white/15 transition"
                            >
                                Browse Teachers
                            </Link>
                            <Link
                                to="/how-it-works"
                                className="w-full sm:w-auto rounded-xl px-7 py-3 text-base font-semibold text-white/90 hover:text-white transition"
                            >
                                How It Works
                            </Link>
                        </div>

                        {/* Trust row */}
                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-white/90">
                            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
                                <div className="flex items-center justify-center gap-2">
                                    <ShieldCheckIcon className="h-5 w-5" />
                                    <span className="font-semibold">Secure Payment</span>
                                </div>
                                <p className="mt-1 text-sm text-white/75">Digital wallet and verified transactions.</p>
                            </div>
                            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
                                <div className="flex items-center justify-center gap-2">
                                    <VideoCameraIcon className="h-5 w-5" />
                                    <span className="font-semibold">One-on-One Sessions</span>
                                </div>
                                <p className="mt-1 text-sm text-white/75">Full focus and faster progress.</p>
                            </div>
                            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4">
                                <div className="flex items-center justify-center gap-2">
                                    <CalendarDaysIcon className="h-5 w-5" />
                                    <span className="font-semibold">Flexible Scheduling</span>
                                </div>
                                <p className="mt-1 text-sm text-white/75">Pick the right time from anywhere.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            {/* HOW IT WORKS */}
            <section className="container mx-auto px-4 py-24 relative">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-heading">
                        Start Your Journey in 3 Steps
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        A simple learning experience that starts with a few steps
                    </p>
                </div>

                <div className="relative max-w-6xl mx-auto">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: 'Create Your Account', desc: 'Sign up as a student for free in seconds.', icon: UserIcon },
                            { title: 'Choose Your Teacher', desc: 'Browse teacher profiles and listen to their recitations to pick the best fit.', icon: MagnifyingGlassIcon },
                            { title: 'Start Your Session', desc: 'Book your slot and enter the high-quality virtual classroom.', icon: VideoCameraIcon },
                        ].map((item, idx) => (
                            <div key={idx} className="relative flex flex-col items-center text-center group">
                                {/* Icon Circle */}
                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-gray-900 ring-4 ring-gray-50 dark:ring-gray-800 transition-all duration-300 group-hover:ring-gold group-hover:scale-110 shadow-lg mb-6">
                                    <item.icon className="h-8 w-8 text-primary-green group-hover:text-gold transition-colors duration-300" />
                                    {/* Number Badge */}
                                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-gray-900">
                                        {idx + 1}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHO IS IT FOR */}
            {/* WHO IS IT FOR */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-20">
                        {/* Left Column: text */}
                        <div className="w-full lg:w-1/2">
                            <h2 className="text-base font-semibold leading-7 text-primary-green">Who is this platform for?</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-heading leading-tight">
                                A Complete Learning Environment for Everyone
                            </p>
                            <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                We designed our curricula and tools for all ages and levels, from foundation to Ijazah. Whether you are a beginner or advanced, you will find a path that fits your ambition.
                            </p>
                            <div className="mt-8 flex gap-4">
                                <Link to="/register/student" className="text-sm font-semibold leading-6 text-gold hover:text-yellow-500 transition-colors flex items-center gap-2">
                                    Start Your Journey Now <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Features List */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-6">
                            {/* Feature 1 */}
                            <div className="group relative bg-white dark:bg-gray-800/50 p-6 rounded-2xl ring-1 ring-gray-900/5 dark:ring-white/10 hover:ring-gold/30 transition-all duration-300">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 group-hover:bg-gold/20 transition-colors">
                                            <SparklesIcon className="h-6 w-6 text-gold" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Diverse Tracks</h3>
                                        <p className="mt-2 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Covering memorization, review, recitation correction, and foundation (Noorani Qaida) for children and adults.
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {['Recitation', 'Memorization', 'Tajweed', 'Noorani'].map(tag => (
                                                <span key={tag} className="inline-flex items-center rounded-md bg-gray-50 dark:bg-white/5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="group relative bg-white dark:bg-gray-800/50 p-6 rounded-2xl ring-1 ring-gray-900/5 dark:ring-white/10 hover:ring-primary-green/30 transition-all duration-300">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-green/10 group-hover:bg-primary-green/20 transition-colors">
                                            <GlobeAltIcon className="h-6 w-6 text-primary-green" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Full Flexibility</h3>
                                        <p className="mt-2 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Learn at the time that suits you, from anywhere in the world. No rigid schedules, you set your own session times.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA TEACHER */}
            <section className="py-24 transition-colors">
                <div className="container mx-auto px-4">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-green to-[#064e3b] px-6 py-16 shadow-2xl sm:px-16 md:pt-20 lg:flex lg:gap-x-20 lg:px-24">
                        {/* Decorative blurs */}
                        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-80 h-80 bg-gold/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-0 lg:text-right">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-heading">
                                Are You a Quran Teacher?
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-gray-100">
                                Join the elite teachers on "{branding.nameEn}". Share your knowledge and be part of a global learning community connecting you with students everywhere.
                            </p>
                            <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                                <Link
                                    to="/register/teacher"
                                    data-tour="cta-register-teacher"
                                    className="rounded-xl bg-gold px-8 py-3.5 text-lg font-bold text-gray-900 shadow-lg hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all transform hover:-translate-y-1"
                                >
                                    Join the Teaching Team
                                </Link>
                                <Link to="/how-it-works" className="text-base font-semibold leading-6 text-white hover:text-gold transition">
                                    Learn More <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>

                        {/* Decorative Icon */}
                        <div className="relative mt-8 h-full hidden lg:block flex-1">
                            <AcademicCapIcon className="h-64 w-64 text-white/5 absolute left-10 top-1/2 -translate-y-1/2 rotate-12" />
                        </div>
                    </div>
                </div>
            </section>

        </div>
        </>
    );
};

export default LandingPage;
