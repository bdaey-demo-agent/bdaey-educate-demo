import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import notificationService from '../../services/notificationService';
import { signalRService } from '../../services/signalrService';

// Basic interface
interface Notification {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
}

const NotificationsDropdown: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropDownRef = useRef<HTMLDivElement>(null);
    // const queryClient = useQueryClient(); // Removed
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropDownRef.current && !dropDownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Or just poll/refresh when user clicks
    useEffect(() => {
        loadNotifications();

        // SignalR Listener
        const handleNotification = (_message: string) => {
            // Optimistically add notification or reload
            // For now, simpler to reload to get full object including ID/Date
            loadNotifications();
        };

        signalRService.on('ReceiveNotification', handleNotification);

        // Polling fallback every 60s just in case
        const interval = setInterval(loadNotifications, 60000);

        return () => {
            signalRService.off('ReceiveNotification', handleNotification);
            clearInterval(interval);
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleReadAll = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        // 1. Mark as read
        if (!notif.isRead) {
            await handleRead(notif.id);
        }

        // 2. Close dropdown
        setIsOpen(false);

        // 3. Navigate or Refresh
        const role = user?.role;
        const currentPath = location.pathname;

        switch (notif.type) {
            case 'Booking':
                const bookingPath = role === 'Teacher' ? '/teacher/bookings' : '/student/schedule';
                if (currentPath === bookingPath) {
                    // Refresh manually if needed or rely on component polling/signalR
                    window.location.reload(); // Simple fallback for now
                } else {
                    navigate(bookingPath);
                }
                break;
            case 'Wallet':
                const walletPath = role === 'Teacher' ? '/teacher/finance' : '/student/wallet';
                if (currentPath === walletPath) {
                    window.location.reload();
                } else {
                    navigate(walletPath);
                }
                break;
            // Add more types as needed
            default:
                // Default fallback or no action
                break;
        }
    };

    return (
        <div className="relative" ref={dropDownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed left-4 right-4 top-20 md:absolute md:top-full md:left-0 md:right-auto md:w-80 md:translate-x-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 dark:text-white">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleReadAll}
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">لا توجد إشعارات</div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-semibold flex items-center gap-1 ${!notif.isRead ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {notif.message.includes('خصم') && <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />}
                                            {notif.title}
                                        </h4>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(notif.createdAt).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                        {notif.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsDropdown;
