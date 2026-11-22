import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon, Bars3Icon } from '@heroicons/react/24/outline';
import NotificationsDropdown from '../common/NotificationsDropdown';

interface TopBarProps {
    onToggleSidebar?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="topbar sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b dark:border-gray-700 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-4">
                {/* Mobile Sidebar Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            {/* Right Side Actions */}
            <div className="user-menu">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="btn-icon"
                >
                    {theme === 'dark' ? <SunIcon className="h-6 w-6 text-gold-400" /> : <MoonIcon className="h-6 w-6" />}
                </button>

                {/* Notifications */}
                {/* Notifications */}
                <NotificationsDropdown />

                {/* User Info / Avatar */}
                <div className="d-flex align-center gap-3 border-r px-4 dark:border-gray-700">
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-bold m-0 font-heading text-primary-green dark:text-gold-400">
                            {user?.fullName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 m-0 text-left">
                            {user?.role === 'Teacher' ? 'Teacher' : 'Student'}
                        </p>
                    </div>
                    {/* Placeholder Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-lg">
                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
