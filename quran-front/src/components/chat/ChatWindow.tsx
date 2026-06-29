
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import chatService, { type ChatMessage, type ChatUser } from '../../services/chatService';
import { signalRService } from '../../services/signalrService';
import { BASE_URL } from '../../config';
import { PaperAirplaneIcon, UserCircleIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const ChatWindow: React.FC = () => {
    // const { user } = useAuth(); // Unused
    // Check if we navigated here with a target user
    const location = useLocation();
    const targetedUser = location.state?.selectedUser as ChatUser | undefined;

    const [conversations, setConversations] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(targetedUser || null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-scroll to bottom ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load contacts on mount
    useEffect(() => {
        loadContacts();
    }, []);

    // SignalR listener
    useEffect(() => {
        const handleMessage = (msg: ChatMessage) => {
            // Check if message belongs to current focused conversation
            // Accessing current selectedUser state inside listener requires ref or functional update
            // But simpler to just always update messages if it matches, or refresh contacts

            // Deduplicate: If message already exists, ignore
            setSelectedUser((currentUser) => {
                if (currentUser && (msg.senderId === currentUser.id || msg.receiverId === currentUser.id)) {
                    setMessages(prev => {
                        // Check if msg.id exists
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                } else {
                    // Refresh contacts to show new notification/badge potential?
                    loadContacts();
                }
                return currentUser; // Return existing state
            });
        };

        signalRService.on('ReceiveMessage', handleMessage);

        return () => {
            signalRService.off('ReceiveMessage', handleMessage);
        };
    }, []);

    // Sync targetedUser from location state
    useEffect(() => {
        if (targetedUser && !selectedUser) {
            // We use functional update or check inside loadContacts? 
            // Better to just set it here if completely null
            setSelectedUser(targetedUser);
        }
    }, [targetedUser]); // safe as targetedUser comes from location which shouldn't change wildly?

    // Load history when selectedUser changes (by ID comparison to avoid obj ref issues)
    useEffect(() => {
        if (selectedUser) {
            loadHistory(selectedUser.id);
        }
    }, [selectedUser?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadContacts = async () => {
        try {
            const data = await chatService.getContacts();
            setConversations(data);

            // If we have a targeted user (ID only), try to find full details in list or use passed state
            // But be careful NOT to force update if already set to same ID

            if (targetedUser) {
                const found = data.find(u => u.id === targetedUser.id);
                if (found) {
                    setSelectedUser(prev => {
                        if (prev?.id === found.id) return prev; // No change
                        return found;
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load contacts', error);
        }
    };

    const loadHistory = async (userId: string) => {
        setLoading(true);
        try {
            const data = await chatService.getHistory(userId);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const msg = await chatService.sendMessage(selectedUser.id, newMessage);
            setMessages([...messages, msg]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
            toast.error('لم يتم إرسال الرسالة. تأكد من وجود حجز مؤكد.');
        }
    };

    return (
        <div className="flex h-full md:h-[calc(100vh-140px)] bg-white dark:bg-gray-800 md:rounded-2xl shadow-none md:shadow-xl overflow-hidden border-0 md:border dark:border-gray-700">
            {/* Sidebar - Conversations */}
            <div className={`w-full md:w-1/3 border-l border-gray-200 dark:border-gray-700 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-bold text-gray-800 dark:text-white">المحادثات</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">لا يوجد لديك أي جهات اتصال مصرحة (حجوزات مؤكدة).</div>
                    ) : (
                        conversations.map(u => (
                            <div
                                key={u.id}
                                onClick={() => setSelectedUser(u)}
                                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
                            >
                                {u.profilePictureUrl ? (
                                    <img src={`${BASE_URL}${u.profilePictureUrl}`} alt={u.fullName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.fullName}</p>
                                    {u.nextSessionDate && (
                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {new Date(u.nextSessionDate).toLocaleDateString('ar-EG')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col w-full md:w-auto ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {!selectedUser ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        اختر محادثة للبدء
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="md:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                >
                                    <ArrowRightIcon className="w-6 h-6" />
                                </button>

                                {selectedUser.profilePictureUrl ? (
                                    <img src={`${BASE_URL}${selectedUser.profilePictureUrl}`} alt={selectedUser.fullName} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                                )}
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedUser.fullName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Next Session Bar */}
                        {selectedUser.nextSessionDate && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-4 py-2 flex items-center justify-between">
                                <span className="text-sm text-blue-800 dark:text-blue-300 font-medium flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    موعد الجلسة القادمة: {new Date(selectedUser.nextSessionDate).toLocaleString('ar-EG')}
                                </span>
                                {/* Optional: "Join" button if close to time? */}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-950">
                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="flex justify-start">
                                        <div className="h-10 w-48 bg-gray-300 dark:bg-gray-700 rounded-2xl rounded-bl-none"></div>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className="h-10 w-48 bg-blue-200 dark:bg-blue-900 rounded-2xl rounded-br-none"></div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded-2xl rounded-bl-none"></div>
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm">لا توجد رسائل سابقة. ابدأ المحادثة!</div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} `}>
                                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${msg.isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                                            } `}>
                                            <p className="text-sm break-words">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${msg.isMe ? 'text-blue-100' : 'text-gray-400'} `}>
                                                {new Date(msg.sentAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="px-3 py-2 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2 shrink-0 pb-safe items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="اكتب رسالتك..."
                                className="flex-1 px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-full dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
                            >
                                <PaperAirplaneIcon className="w-5 h-5 -rotate-90 rtl:rotate-90" />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;
