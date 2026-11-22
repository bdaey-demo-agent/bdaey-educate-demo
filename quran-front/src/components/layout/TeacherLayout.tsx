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
                    // Fail closed: when the status cannot be verified, keep the
                    // navigation lock on instead of silently disabling it.
                    setStatus('Unknown');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const showPendingBanner = status === 'Pending' || status === 'Rejected';
    // Lock every non-approved teacher to the profile-completion (dashboard) page.
    const isPending = status !== 'Approved';
    const isProfilePage = location.pathname.includes('/teacher/profile');

    if (loading) return <div className="p-10 text-center">Loading...</div>;

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
                    {showPendingBanner && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700 font-bold">
                                        {status === 'Pending'
                                            ? 'Your account is under review. Please complete your profile so the team can approve your application.'
                                            : 'Sorry, your account has been temporarily suspended. Please contact the admin team.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'Unknown' && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                            <p className="text-sm text-yellow-700 font-bold">
                                We could not verify your account status. Some pages are temporarily restricted; please try again in a moment.
                            </p>
                        </div>
                    )}

                    {/* Enforce Profile/Dashboard only if Pending */}
                    {isPending && !isProfilePage && !location.pathname.includes('/teacher/dashboard') ? (
                        <div className="text-center mt-20">
                            <h2 className="text-2xl font-bold text-gray-700">Access Restricted</h2>
                            <p className="mt-2 text-gray-500 mb-6">Complete your profile and wait for approval to access this page.</p>
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
