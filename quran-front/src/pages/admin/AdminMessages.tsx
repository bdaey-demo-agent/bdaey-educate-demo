import { useState } from 'react';
import MessagesTab from './tabs/MessagesTab';
import SendNotificationModal from '../../components/admin/SendNotificationModal';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

const AdminMessages = () => {
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages and Notifications</h1>

                <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-green hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <MegaphoneIcon className="h-5 w-5" />
                    <span>Send Broadcast Notification</span>
                </button>
            </div>

            <MessagesTab />

            <SendNotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
            />
        </div>
    );
};

export default AdminMessages;
