import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Squares2X2Icon as LayoutDashboard,
    ArchiveBoxIcon,
    AcademicCapIcon as GraduationCap,
    UserGroupIcon as Users,
    CalendarIcon as Calendar,
    BanknotesIcon as Wallet,
    BanknotesIcon,
    ShieldCheckIcon as Shield,
    DocumentTextIcon as FileText,
    ChatBubbleLeftRightIcon as MessageSquare,
    Cog6ToothIcon as Settings,
    TicketIcon as Ticket,
    Bars3Icon as Menu,
    ArrowRightOnRectangleIcon as LogOut,
    XMarkIcon as X,
    SunIcon,
    MoonIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
        { path: 'teachers', label: 'المعلمون', icon: GraduationCap },
        { path: 'students', label: 'الطلاب', icon: Users },
        { path: 'bookings', label: 'الحجوزات', icon: Calendar },
        { path: 'packages', label: 'الباقات', icon: ArchiveBoxIcon },
        { path: 'payouts', label: 'المدفوعات', icon: Wallet },
        { path: 'withdrawals', label: 'طلبات السحب', icon: BanknotesIcon },
        { path: 'users', label: 'المستخدمين', icon: Shield },
        { path: 'promo-codes', label: 'الكوبونات', icon: Ticket },
        { path: 'financial', label: 'المالية', icon: FileText },
        { path: 'messages', label: 'الرسائل', icon: MessageSquare },
        { path: 'settings', label: 'الإعدادات', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors duration-300" dir="ltr">
            {/* Sidebar Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 right-0 h-screen w-64 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700
                transform transition-transform duration-200 z-30
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-700">
                        <span className="text-xl font-bold text-primary dark:text-gold-500">لوحة الإدارة</span>
                        <button
                            className="mr-auto lg:hidden text-gray-500 dark:text-gray-400"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-primary/10 text-primary dark:bg-gold-500/10 dark:text-gold-500'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200'}
                                `}
                            >
                                <item.icon className="ml-3 h-5 w-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex items-center mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-gold-500/10 flex items-center justify-center text-primary dark:text-gold-500 font-bold">
                                {user?.fullName?.[0] || 'م'}
                            </div>
                            <div className="mr-3 overflow-hidden">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <button
                                onClick={toggleTheme}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                {theme === 'dark' ? <SunIcon className="h-5 w-5 text-yellow-400" /> : <MoonIcon className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <LogOut className="ml-2 h-5 w-5" />
                                خروج
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 lg:px-8">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white mr-4 lg:mr-0">
                        لوحة التحكم
                    </h1>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
