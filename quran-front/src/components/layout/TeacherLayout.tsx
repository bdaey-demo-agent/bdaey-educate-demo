import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import SidebarTeacher from './SidebarTeacher';
import Header from './Header';
import teacherService from '../../services/teacherService';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';


const TeacherLayout: React.FC = () => {
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const profile = await teacherService.getMyProfile();
                setStatus(profile.status);
            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    // Profile not found -> Pending creation
                    setStatus('Pending');
                } else {
                    console.error("Failed to fetch profile status", error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const isPending = status === 'Pending' || status === 'Rejected';
    const isProfilePage = location.pathname.includes('/teacher/profile');

    if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-light dark:bg-gray-900 transition-colors duration-300" dir="ltr">
            {/* Sidebar (Fixed Right) */}
            <SidebarTeacher
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <Header onToggleSidebar={() => setSidebarOpen(true)} />

            {/* Main Content Area (Pushed Left on Desktop) */}
            <div className="flex flex-col min-h-screen transition-all duration-300 mr-0 md:mr-[280px] pt-20">
                <main className="flex-1 p-6 dashboard-grid">
                    {isPending && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700 font-bold">
                                        {status === 'Pending'
                                            ? 'حسابك قيد المراجعة. يرجى إكمال جميع بيانات الملف الشخصي ليتسنى للإدارة الموافقة على طلبك.'
                                            : 'عذراً، تم تعليق حسابك مؤقتاً. يرجى مراجعة الإدارة.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enforce Profile/Dashboard only if Pending */}
                    {isPending && !isProfilePage && !location.pathname.includes('/teacher/dashboard') ? (
                        <div className="text-center mt-20">
                            <h2 className="text-2xl font-bold text-gray-700">الوصول مقيد</h2>
                            <p className="mt-2 text-gray-500 mb-6">يجب إكمال الملف الشخصي وانتظار الموافقة للوصول إلى هذه الصفحة.</p>
                            <Navigate to="/teacher/dashboard" replace />
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>

        </div>
    );
};

export default TeacherLayout;
