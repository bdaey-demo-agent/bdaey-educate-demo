import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const StudentLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, resendVerification } = useAuth();

    return (
        <div className="min-h-screen bg-light dark:bg-gray-900 transition-colors duration-300" dir="ltr">
            {/* Sidebar (Fixed Right) */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <Header onToggleSidebar={() => setSidebarOpen(true)} />

            {/* Main Content Area (Pushed Left on Desktop) */}
            <div className="flex flex-col min-h-screen transition-all duration-300 mr-0 md:mr-[280px] pt-20">
                {user?.role === 'Student' && !user?.emailConfirmed && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 border-r-4 border-orange-500 text-orange-800 dark:text-orange-200 p-4 mx-6 mt-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <p className="text-sm sm:text-base">
                            <strong className="font-bold">Security Notice: </strong>
                            Please verify your email to use the platform fully. (Check your Spam folder if the message did not arrive).
                        </p>
                        <button
                            onClick={resendVerification}
                            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors shadow-sm"
                        >
                            Send Activation Link
                        </button>
                    </div>
                )}
                <main className="flex-1 p-6 dashboard-grid">
                    <Outlet />
                </main>
            </div>

        </div>
    );
};

export default StudentLayout;
