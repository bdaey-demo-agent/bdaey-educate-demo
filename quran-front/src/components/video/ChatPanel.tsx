import React, { useState, useEffect, useRef } from 'react';
import { useAppMessage, useLocalParticipant } from '@daily-co/daily-react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface ChatMessage {
    id: string;
    senderName: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isLocal: boolean;
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    callObject: any;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, callObject }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const localParticipant = useLocalParticipant();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useAppMessage({
        onAppMessage: (e: any) => {
            if (e && e.data && e.data.type === 'chat') {
                const newMessage: ChatMessage = {
                    id: Math.random().toString(36).substring(7),
                    senderName: e.data.name,
                    senderId: e.fromId,
                    text: e.data.text,
                    timestamp: new Date(),
                    isLocal: false
                };
                setMessages((prev) => [...prev, newMessage]);
            }
        }
    });

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !callObject || !localParticipant) return;

        const text = inputValue.trim();

        // Add to local state
        const newMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            senderName: localParticipant.user_name || 'أنت',
            senderId: localParticipant.session_id,
            text: text,
            timestamp: new Date(),
            isLocal: true
        };

        setMessages((prev) => [...prev, newMessage]);

        // Send to others
        callObject.sendAppMessage({
            type: 'chat',
            text: text,
            name: localParticipant.user_name || 'مشارك',
        });

        setInputValue('');
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-20 shadow-2xl transition-transform transform translate-x-0">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="font-bold text-lg text-white">المحادثة</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        لا توجد رسائل حتى الآن. كن أول من يرسل!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-gray-400 mb-1">{msg.isLocal ? 'أنت' : msg.senderName}</span>
                            <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words ${msg.isLocal ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-700 text-white rounded-bl-sm'}`}>
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 pb-28 border-t border-gray-700 bg-gray-900/50">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="اكتب رسالة..."
                        className="w-full bg-gray-700 text-white rounded-full pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
                        dir="auto"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute left-1 p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
                    >
                        <PaperAirplaneIcon className="w-5 h-5 -rotate-90" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;
