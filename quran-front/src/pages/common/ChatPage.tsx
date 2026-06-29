import React from 'react';
import ChatWindow from '../../components/chat/ChatWindow';

const ChatPage: React.FC = () => {
    return (
        <div className="container mx-auto p-0 md:px-4 md:py-8 h-[calc(100vh-64px)] md:h-auto">
            <div className="mb-6 hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الرسائل</h1>
                <p className="text-gray-600 dark:text-gray-400">تواصل مع الطلاب والمعلمين</p>
            </div>
            <ChatWindow />
        </div>
    );
};

export default ChatPage;
