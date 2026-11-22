import React, { useState, useEffect } from 'react';
import { branding } from '../../branding';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../common/NotificationsDropdown';

const MainLayout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const location = useLocation();

    // Progress Bar Logic
    useEffect(() => {
        setProgress(30);
        const timer = setTimeout(() => setProgress(100), 400);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Reset Progress when done
    useEffect(() => {
        if (progress === 100) {
            const timer = setTimeout(() => setProgress(0), 200);
            return () => clearTimeout(timer);
        }
    }, [progress]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300" dir="ltr">
            {/* 1. Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50 pointer-events-none">
                <div
                    className="h-full bg-tomato-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
                ></div>
            </div>

            {/* Header: Fixed Dark Translucent Look (Restoring Old Vibe) */}
            <Disclosure as="nav" className="bg-black/80 backdrop-blur-md border-b border-white/10 fixed w-full top-0 z-40 transition-colors duration-300">
                {({ open }) => (
                    <>
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex h-20 justify-between items-center">

                                {/* 2. Mobile Menu Button - White Icon */}
                                <div className="flex items-center md:hidden">
                                    <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 focus:outline-none">
                                        <span className="sr-only">Open main menu</span>
                                        {open ? (
                                            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                        ) : (
                                            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                        )}
                                    </Disclosure.Button>
                                </div>

                                {/* 3. Mobile Dark Mode Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="md:hidden p-2 rounded-full text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                    {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-300" />}
                                </button>

                                {/* 4. Brand Logo - Image ONLY (Text Removed) */}
                                <div className="flex-shrink-0 flex items-center justify-center flex-1 md:flex-none md:justify-start">
                                    <Link to="/" className="flex items-center gap-2">
                                        <img
                                            className="h-12 w-auto"
                                            src={branding.logoUrl}
                                            alt={`${branding.nameEn} Logo`}
                                        />
                                        {/* Text Removed per request */}
                                    </Link>
                                </div>

                                {/* Desktop Navigation - Admin Only - UPDATED DROPDOWN */}
                                <div className="hidden md:flex md:space-x-8 md:space-x-reverse items-center">
                                    <div className="relative group">
                                        <button className="text-gray-100 hover:text-gold-500 px-3 py-2 text-base font-medium transition-colors font-item flex items-center gap-1 focus:outline-none">
                                            Home
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right">
                                            <Link to="/admin/dashboard?tab=overview" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm font-medium border-b border-gray-100 dark:border-gray-700/50">
                                                Overview
                                            </Link>
                                            <Link to="/admin/dashboard?tab=teachers" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm font-medium border-b border-gray-100 dark:border-gray-700/50">
                                                Teachers
                                            </Link>
                                            <Link to="/admin/dashboard?tab=students" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm font-medium border-b border-gray-100 dark:border-gray-700/50">
                                                Students
                                            </Link>
                                            <Link to="/admin/dashboard?tab=messages" className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors">
                                                Messages
                                            </Link>
                                        </div>
                                    </div>

                                    <Link to="/admin/financial" className="text-gray-100 hover:text-gold-500 px-3 py-2 text-base font-medium transition-colors font-item">
                                        Transactions
                                    </Link>
                                    <Link to="/admin/how-it-works" className="text-gray-100 hover:text-gold-500 px-3 py-2 text-base font-medium transition-colors font-item">
                                        User Guide
                                    </Link>
                                    <Link to="/admin/settings" className="text-gray-100 hover:text-gold-500 px-3 py-2 text-base font-medium transition-colors font-item">
                                        Settings
                                    </Link>
                                </div>

                                {/* 5. Desktop Actions & Dark Toggle */}
                                <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                                    <button
                                        onClick={toggleTheme}
                                        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                                    >
                                        {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-300" />}
                                    </button>

                                    {user ? (
                                        <div className="flex items-center gap-4">
                                            <NotificationsDropdown />
                                            <div className="text-base font-medium text-white">
                                                Hello, {user.fullName}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    navigate('/login');
                                                }}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/50 px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-3 space-x-reverse">
                                            {/* Restored Login to Ghost/White style, Register kept Tomato */}
                                            <Link
                                                to="/login"
                                                className="px-5 py-2 border border-white/30 text-white rounded-md hover:bg-white/10 transition-colors text-sm font-bold"
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                to="/register/teacher"
                                                className="rounded-md bg-tomato-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-tomato-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato-500 transition-colors"
                                            >
                                                Join as Teacher
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu Panel - Dark Theme */}
                        <Disclosure.Panel className="md:hidden border-t border-white/10 bg-gray-900 transition-colors duration-300">
                            <div className="space-y-1 px-2 pb-3 pt-2">
                                {/* Mobile Admin Links can go here */}

                                {!user && (
                                    <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2">
                                        <Disclosure.Button as={Link} to="/login" className="block w-full text-center rounded-md px-3 py-2 text-base font-medium border border-white/30 text-white hover:bg-white/10">
                                            Sign In
                                        </Disclosure.Button>
                                        <Disclosure.Button as={Link} to="/register/student" className="block w-full text-center rounded-md px-3 py-2 text-base font-medium bg-tomato-500 text-white hover:bg-tomato-600">
                                            Sign Up
                                        </Disclosure.Button>
                                    </div>
                                )}
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>

            <main className="flex-grow pt-20"> {/* Added pt-20 to account for fixed header */}
                <Outlet />
            </main>

            <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-12 transition-colors duration-300">
                <div className="container mx-auto px-4 text-center">
                    <h3 className="text-xl font-bold text-gold-500 mb-4">{branding.nameAr}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
                        Empowering you to learn Quran and Islamic sciences with certified teachers.
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm">
                        © {new Date().getFullYear()} {branding.nameEn}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};
export default MainLayout;
