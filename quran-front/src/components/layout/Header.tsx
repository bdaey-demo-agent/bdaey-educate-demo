import React from 'react';
import { branding } from '../../branding';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import NotificationsDropdown from '../common/NotificationsDropdown';

interface HeaderProps {
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const { isAuthenticated, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const { theme, toggleTheme } = useTheme();

    const getHomeLink = () => {
        if (!isAuthenticated) return '/';
        if (user?.role === 'Teacher') return '/teacher/home';
        if (user?.role === 'Student') return '/student/home';
        if (user?.role === 'Admin') return '/admin/dashboard';
        return '/';
    };

    return (
        <header className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 shadow-sm fixed top-0 w-full z-50 transition-all duration-300">
            <div className="container h-20 flex items-center justify-between">

                {/* Left Section: Logo & Sidebar Toggle */}
                <div className="flex items-center gap-4">
                    <Link to={getHomeLink()} className="flex items-center gap-2 text-decoration-none">
                        <img src={branding.logoUrl} alt={`${branding.nameAr} - للتعليم القرآني`} className="h-11 w-auto object-contain" />
                    </Link>

                    {/* Mobile Sidebar Toggle (Only if onToggleSidebar is provided) */}
                    {onToggleSidebar && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors md:hidden"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                    )}
                </div>

                {/* Middle: Navigation Links */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link to={getHomeLink()} className="text-gray-700 hover:text-primary-green font-medium transition-colors">الرئيسية</Link>
                    <Link to="/teachers-public" className="text-gray-700 hover:text-primary-green font-medium transition-colors">المعلمون</Link>
                    {isAuthenticated && (
                        <Link
                            to={user?.role === 'Teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                            className="text-gray-700 hover:text-primary-green font-medium transition-colors"
                        >
                            لوحة التحكم
                        </Link>
                    )}
                </nav>

                {/* Right: Auth & Actions */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        {theme === 'dark' ? <SunIcon className="h-6 w-6 text-gold-400" /> : <MoonIcon className="h-6 w-6" />}
                    </button>

                    {isAuthenticated ? (
                        <>
                            <NotificationsDropdown />
                            <div className="hidden md:flex items-center gap-3 border-r pr-4 dark:border-gray-700">
                                <div className="text-right">
                                    <p className="text-sm font-bold m-0 font-heading text-primary-green dark:text-gold-400">
                                        {user?.fullName || 'المستخدم'}
                                    </p>
                                    <p className="text-xs text-gray-500 m-0 text-right">
                                        {user?.role === 'Teacher' ? 'معلم' : 'طالب'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-lg">
                                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="hidden md:flex items-center gap-4">
                            <Link to="/login" className="text-gray-700 hover:text-primary-green font-medium transition-colors">تسجيل الدخول</Link>
                            <Link to="/register/student" className="btn-primary text-sm px-5 py-2">
                                ابدأ الآن
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button (Only for public view usually, but we keep it for now if needed) */}
                    <button
                        className="md:hidden p-2 text-gray-700 hover:text-primary-green"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 absolute w-full left-0 top-20 shadow-lg py-4 px-6 flex flex-col gap-4 animate-fade-in z-40">
                        <Link to={getHomeLink()} onClick={() => setIsMenuOpen(false)} className="py-2 text-gray-700 hover:text-primary-green border-b border-gray-100 dark:border-gray-700">الرئيسية</Link>
                        <Link to="/teachers-public" onClick={() => setIsMenuOpen(false)} className="py-2 text-gray-700 hover:text-primary-green border-b border-gray-100 dark:border-gray-700">المعلمون</Link>

                        <div className="pt-4 flex flex-col gap-3">
                            {isAuthenticated ? (
                                <Link
                                    to={user?.role === 'Teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="btn-primary text-center py-3"
                                >
                                    لوحة التحكم
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-outline text-center py-3 border-gray-300 text-gray-700">تسجيل الدخول</Link>
                                    <Link to="/register/student" onClick={() => setIsMenuOpen(false)} className="btn-gold text-center py-3">ابدأ رحلتك</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
