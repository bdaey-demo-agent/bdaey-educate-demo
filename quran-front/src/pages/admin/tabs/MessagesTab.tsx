import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import messageService, { type ContactMessage } from '../../../services/messageService';
import toast from 'react-hot-toast';

const MessagesTab: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    const filteredMessages = messages.filter(msg => filter === 'All' || msg.reason === filter || (!msg.reason && filter === 'General'));

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await messageService.getAllMessages();
            // Sort by date desc
            setMessages(data.sort((a: ContactMessage, b: ContactMessage) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime()));
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل الرسائل');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await messageService.markAsRead(id);
            setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg));
            toast.success('تم تحديد الرسالة كمقرؤة');
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">رسائل التواصل</h2>
                <select
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="All">الكل</option>
                    <option value="General">عام</option>
                    <option value="Suspension">تعليق حساب</option>
                    <option value="Complaint">شكوى</option>
                </select>
            </div>

            {filteredMessages.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <EnvelopeIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">لا توجد رسائل جديدة</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMessages.map((message) => (
                            <li key={message.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {message.isRead ? (
                                                <EnvelopeOpenIcon className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <EnvelopeIcon className="h-5 w-5 text-gold-500" />
                                            )}
                                            {message.reason === 'Suspension' && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">تعليق حساب</span>
                                            )}
                                            {message.reason === 'Complaint' && (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">شكوى</span>
                                            )}
                                            {message.reason === 'Suggestion' && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">اقتراح</span>
                                            )}
                                            <p className={`text-sm font-medium ${message.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {message.subject}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(message.dateSent).toLocaleDateString('ar-EG')}
                                            </p>
                                            {!message.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(message.id)}
                                                    className="ml-2 p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                                                    title="تحديد كمقروء"
                                                >
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                                                <span className="font-bold ml-1">{message.name}</span>
                                                &lt;{message.email}&gt;
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                                        {message.message}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MessagesTab;
