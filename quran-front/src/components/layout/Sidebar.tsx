import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, CalendarIcon, WalletIcon, UserIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon, XMarkIcon, ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
        { name: 'My Schedule', href: '/student/schedule', icon: CalendarIcon },
        { name: 'Messages', href: '/student/chat', icon: ChatBubbleLeftRightIcon },
        { name: 'My Learning Record', href: '/student/progress', icon: ChartBarIcon },
        { name: 'Leaderboard', href: '/student/leaderboard', icon: TrophyIcon },
        { name: 'Wallet', href: '/student/wallet', icon: WalletIcon },
        { name: 'Profile', href: '/student/profile', icon: UserIcon },
    ];

    const isActive = (path: string) => location.pathname === path;

    // Overlay for Mobile
    const overlayClass = isOpen
        ? 'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden'
        : 'hidden';

    // Sidebar Class
    const sidebarClass = `
        sidebar 
        bg-white dark:bg-gray-800 
        transition-all duration-300 
        flex flex-col 
        fixed top-20 right-0 h-[calc(100vh-5rem)] z-40
        border-l dark:border-gray-700
        w-[280px]
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
    `;

    return (
        <>
            <div className={overlayClass} onClick={onClose}></div>

            <div className={sidebarClass}>
                <div className="sidebar-logo p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 text-decoration-none">
                        {/* Placeholder Logo if needed */}
                        <h2 className="text-xl font-bold text-primary-green dark:text-white font-heading m-0">Student Menu</h2>
                    </Link>
                    <button onClick={onClose} className="md:hidden text-gray-500 hover:text-red-500">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <nav className="sidebar-menu flex-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="font-body">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t dark:border-gray-700">
                    <button
                        onClick={() => logout('manual')}
                        className="menu-item w-full text-danger hover:bg-red-50 dark:hover:bg-red-900/10 justify-start"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        <span className="font-body">Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
