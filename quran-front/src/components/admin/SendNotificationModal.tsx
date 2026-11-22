import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, PaperAirplaneIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import notificationService from '../../services/notificationService';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import type { UnifiedUser } from '../../types/adminTypes';

interface SendNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ isOpen, onClose }) => {
    const [targetType, setTargetType] = useState('All');
    const [targetId, setTargetId] = useState(''); // Legacy single ID
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Multi-user selection states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UnifiedUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UnifiedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (targetType === 'Users' && searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await adminService.getAllUsers(undefined, searchQuery);
                    setSearchResults(results.slice(0, 5)); // Limit to 5 results
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, targetType]);

    const handleAddUser = (user: UnifiedUser) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Please fill in the title and message');
            return;
        }

        if (targetType === 'Single' && !targetId.trim()) {
            toast.error('Please enter a user ID');
            return;
        }

        if (targetType === 'Users' && selectedUsers.length === 0) {
            toast.error('Please select at least one user');
            return;
        }

        setIsSending(true);
        try {
            await notificationService.sendNotification({
                targetType,
                targetId: targetType === 'Single' ? targetId : undefined,
                targetIds: targetType === 'Users' ? selectedUsers.map(u => u.id) : undefined,
                title,
                message
            });
            toast.success('Notification sent');
            onClose();
            // Reset form
            setTitle('');
            setMessage('');
            setTargetType('All');
            setTargetId('');
            setSelectedUsers([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Failed to send notification:', error);
            toast.error('An error occurred while sending the notification');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-visible rounded-2xl bg-white dark:bg-gray-800 p-6 text-right align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                                        <PaperAirplaneIcon className="h-5 w-5 text-gold" />
                                        Send New Notification
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Target Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Send To
                                        </label>
                                        <select
                                            value={targetType}
                                            onChange={(e) => setTargetType(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-green focus:border-primary-green p-2.5"
                                        >
                                            <option value="All">All Users</option>
                                            <option value="Students">Students Only</option>
                                            <option value="Teachers">Teachers Only</option>
                                            <option value="Users">Specific Users (list)</option>
                                            <option value="Single">Single User (manual ID)</option>
                                        </select>
                                    </div>

                                    {/* Multi-User Selection */}
                                    {targetType === 'Users' && (
                                        <div className="space-y-2 relative">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Search Users
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search by name or email..."
                                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-green focus:border-primary-green p-2.5 pr-10"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {searchQuery.length >= 2 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-auto">
                                                    {isSearching ? (
                                                        <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                                                    ) : searchResults.length > 0 ? (
                                                        <ul className="py-1">
                                                            {searchResults.map((user) => (
                                                                <li
                                                                    key={user.id}
                                                                    onClick={() => handleAddUser(user)}
                                                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex justify-between items-center"
                                                                >
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || 'No name'}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                                    </div>
                                                                    <UserPlusIcon className="h-4 w-4 text-primary-green" />
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="p-4 text-center text-sm text-gray-500">No results</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Selected Users Chips */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedUsers.map((user) => (
                                                    <span
                                                        key={user.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    >
                                                        {user.fullName || user.email}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveUser(user.id)}
                                                            className="text-green-600 dark:text-green-300 hover:text-green-800"
                                                        >
                                                            <XMarkIcon className="h-4 w-4" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Legacy Single ID (Conditional) */}
                                    {targetType === 'Single' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                User ID
                                            </label>
                                            <input
                                                type="text"
                                                value={targetId}
                                                onChange={(e) => setTargetId(e.target.value)}
                                                placeholder="Enter user ID..."
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-green focus:border-primary-green p-2.5"
                                            />
                                        </div>
                                    )}

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Notification Title
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Example: Important platform update"
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-green focus:border-primary-green p-2.5"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Message Body
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={4}
                                            placeholder="Type your message here..."
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-green focus:border-primary-green p-2.5"
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSending}
                                            className="px-6 py-2 text-sm font-medium text-white bg-primary-green rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSending ? (
                                                <>
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <PaperAirplaneIcon className="h-4 w-4 transform -rotate-45" />
                                                    Send
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default SendNotificationModal;
