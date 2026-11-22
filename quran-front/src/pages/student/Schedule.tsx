import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CalendarIcon, VideoCameraIcon, ClockIcon, CheckCircleIcon, XCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import sessionsService from '../../services/sessionsService';
import { videoService } from '../../services/videoService';
import { Link } from 'react-router-dom';
import type { Session } from '../../types/session';
import { useAuth } from '../../context/AuthContext';
import RateSessionModal from '../../components/modals/RateSessionModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import ScheduleSkeleton from '../../components/skeletons/ScheduleSkeleton';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';
import SessionEvaluationModal from '../../components/video/SessionEvaluationModal';

interface ScheduleProps {
    demoMode?: boolean;
    role?: 'Student' | 'Teacher';
}

const Schedule: React.FC<ScheduleProps> = ({ demoMode = false, role }) => {
    const { user: authUser } = useAuth();
    // Use prop role if provided, otherwise fallback to auth user, or default 'Student' for demo safety
    const user = demoMode
        ? { role: role || 'Student', fullName: 'Demo User' }
        : authUser;

    const [rateSessionId, setRateSessionId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'active' | 'completed' | 'cancelled' | 'all'>('active');

    // State for Confirm Modal
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean, sessionId: number | null, newStatus: string | null }>({
        isOpen: false,
        sessionId: null,
        newStatus: null
    });

    // State for Evaluation Modal (Teacher)
    const [evalModalOpen, setEvalModalOpen] = useState(false);
    const [sessionToEval, setSessionToEval] = useState<Session | null>(null);

    // State for sessions
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        if (demoMode) {
            // Mock Sessions
            const now = new Date();
            const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);

            setSessions([
                {
                    id: 1,
                    studentName: 'Youssef Ali',
                    teacherName: 'Sheikh Ahmed',
                    status: 'Scheduled',
                    scheduledAt: tomorrow.toISOString(),
                    durationMinutes: 60,
                    bookingStatus: 'Confirmed'
                },
                {
                    id: 2,
                    studentName: 'Youssef Ali',
                    teacherName: 'Sheikh Ahmed',
                    status: 'Completed',
                    scheduledAt: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
                    durationMinutes: 60,
                    bookingStatus: 'Confirmed',
                    rating: 5
                },
                {
                    id: 3,
                    studentName: 'Youssef Ali',
                    teacherName: 'Sheikh Ahmed',
                    status: 'InProgress', // Feature live session
                    scheduledAt: new Date(now.getTime() - 1000 * 60 * 10).toISOString(), // Started 10 mins ago
                    durationMinutes: 60,
                    bookingStatus: 'Confirmed'
                },
            ] as any);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await sessionsService.getMySessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
            toast.error("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    }, [demoMode]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Handlers
    const handleStartSession = async (session: Session) => {
        const toastId = toast.loading('Preparing the classroom...');
        try {
            // 1. Prepare Room
            await videoService.prepareRoom(session.id);
            // 2. Update status
            await sessionsService.updateSession(session.id, { status: 'InProgress' } as any);

            toast.success('Classroom ready', { id: toastId });
            fetchSessions(); // "Invalidate queries" replacement
        } catch (error) {
            console.error('Error starting session:', error);
            toast.error('An error occurred while starting the session', { id: toastId });
        }
    };

    const handleUpdateStatus = (sessionId: number, newStatus: string) => {
        if (newStatus === 'Completed') {
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                const startDate = new Date(session.scheduledAt);
                const endTime = new Date(startDate.getTime() + session.durationMinutes * 60000);
                const now = new Date();

                // Allow ending if we are within 5 minutes of end time (or after)
                const allowedEndTime = new Date(endTime.getTime() - 5 * 60000);

                if (now < allowedEndTime) {
                    const remainingMs = allowedEndTime.getTime() - now.getTime();
                    const remainingMinutes = Math.ceil(remainingMs / 60000);
                    toast.error(`Cannot end the session now. You can end it up to 5 minutes before its scheduled end. (${remainingMinutes} min remaining)`);
                    return;
                }
            }
        }
        setConfirmModalState({ isOpen: true, sessionId, newStatus });
    };

    const executeStatusUpdate = async () => {
        const { sessionId, newStatus } = confirmModalState;
        if (!sessionId || !newStatus) return;

        try {
            await sessionsService.updateSession(sessionId, { status: newStatus } as any);
            toast.success('Status updated successfully');
            fetchSessions(); // "Invalidate queries" replacement
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('An error occurred while updating the status');
        } finally {
            setConfirmModalState({ ...confirmModalState, isOpen: false });
        }
    };

    const getStatusConfig = (status: string) => {
        const color = getStatusColor(status);
        const label = translateStatus(status);
        let icon = ClockIcon;

        if (status === 'Scheduled') icon = CalendarIcon;
        else if (status === 'InProgress') icon = VideoCameraIcon;
        else if (status === 'Completed' || status === 'Succeeded') icon = CheckCircleIcon;
        else if (status === 'Cancelled' || status === 'NoShow') icon = XCircleIcon;

        return { color, label, icon };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Schedule</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track your upcoming and past sessions</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'active'
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Current
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setFilter('cancelled')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'cancelled'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        Cancelled
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {loading ? (
                <ScheduleSkeleton />
            ) : sessions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <CalendarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No scheduled sessions</h3>
                    <p className="text-gray-600 dark:text-gray-400">Once your bookings are confirmed, your sessions will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.filter(session => {
                        if (filter === 'active') return session.status === 'Scheduled' || session.status === 'InProgress';
                        if (filter === 'completed') return session.status === 'Completed';
                        if (filter === 'cancelled') return session.status === 'Cancelled' || session.status === 'NoShow';
                        return true;
                    }).map((session) => {
                        const statusConfig = getStatusConfig(session.status);
                        const StatusIcon = statusConfig.icon;
                        const sessionDate = new Date(session.scheduledAt);
                        const istoday = new Date().toDateString() === sessionDate.toDateString();

                        return (
                            <div key={session.id} className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border transition-all hover:shadow-md ${istoday ? 'border-gold-400 ring-1 ring-gold-400' : 'border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Date & Time */}
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-3 min-w-[80px]">
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                {sessionDate.toLocaleDateString('ar-EG', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {sessionDate.getDate()}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {sessionDate.toLocaleDateString('ar-EG', { weekday: 'short' })}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                {user?.role === 'Teacher'
                                                    ? `Session with student ${session.studentName}`
                                                    : `Session with teacher ${session.teacherName}`}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon className="h-4 w-4" />
                                                    {sessionDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(sessionDate.getTime() + session.durationMinutes * 60000).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span>({session.durationMinutes} min)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions & Status */}
                                    <div className="flex items-center gap-3">
                                        {session.bookingStatus === 'Pending' && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                Awaiting Approval
                                            </span>
                                        )}

                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusConfig.label}
                                        </span>

                                        {/* Teacher Actions */}
                                        {user?.role === 'Teacher' && (
                                            <>
                                                {session.status === 'Scheduled' && (
                                                    // Logic: Enable only if within 15 mins of start time (or past start time)
                                                    (() => {
                                                        const now = new Date();
                                                        const timeDiff = sessionDate.getTime() - now.getTime();
                                                        const diffMinutes = timeDiff / (1000 * 60);
                                                        const isTooEarly = diffMinutes > 15;

                                                        return (
                                                            <div className="relative group">
                                                                <button
                                                                    onClick={() => {
                                                                        if (isTooEarly) {
                                                                            toast.error('You cannot start the session more than 15 minutes before its time');
                                                                            return;
                                                                        }
                                                                        handleStartSession(session);
                                                                    }}
                                                                    className={`flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg transition-colors ${!isTooEarly
                                                                        ? 'bg-green-600 hover:bg-green-700'
                                                                        : 'bg-gray-400 cursor-not-allowed opacity-70'
                                                                        }`}
                                                                    disabled={isTooEarly}
                                                                    title={isTooEarly ? 'Available 15 minutes before the session' : 'Start Session'}
                                                                >
                                                                    <VideoCameraIcon className="h-5 w-5" />
                                                                    Start Session
                                                                </button>
                                                                {isTooEarly && (
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                        The button unlocks 15 minutes before the session
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                                {session.status === 'InProgress' && (
                                                    <div className="flex gap-2">
                                                        <Link
                                                            to={`/teacher/classroom/${session.id}`}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors"
                                                        >
                                                            <VideoCameraIcon className="h-5 w-5" />
                                                            Enter Classroom
                                                        </Link>
                                                        <button
                                                            onClick={() => handleUpdateStatus(session.id, 'Completed')}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                                                        >
                                                            <CheckCircleIcon className="h-5 w-5" />
                                                            End Session
                                                        </button>
                                                    </div>
                                                )}

                                                {session.status === 'Completed' && !session.hasEvaluation && (
                                                    <button
                                                        onClick={() => {
                                                            setSessionToEval(session);
                                                            setEvalModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-sm animate-pulse"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                        Record Session Report
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Student Actions */}
                                        {user?.role === 'Student' && (
                                            <>
                                                {session.status === 'InProgress' && (
                                                    <Link
                                                        to={`/student/classroom/${session.id}`}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-colors animate-pulse"
                                                    >
                                                        <VideoCameraIcon className="h-5 w-5" />
                                                        Join Session
                                                    </Link>
                                                )}

                                                {/* Review Button */}
                                                {session.status === 'Completed' && !session.rating && (
                                                    <button
                                                        onClick={() => setRateSessionId(session.id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-lg transition-colors"
                                                    >
                                                        <StarIcon className="h-5 w-5" />
                                                        Rate
                                                    </button>
                                                )}

                                                {session.status === 'Completed' && session.rating && (
                                                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                                        <StarIcon className="h-5 w-5" />
                                                        {session.rating}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Rate Modal */}
            {rateSessionId && (
                <RateSessionModal
                    sessionId={rateSessionId}
                    isOpen={true}
                    onClose={() => setRateSessionId(null)}
                    onSuccess={() => {
                        fetchSessions();
                        setRateSessionId(null);
                    }}
                />
            )}

            {/* Confirm Update Status Modal */}
            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
                onConfirm={executeStatusUpdate}
                title="End Session"
                message="Are you sure you want to end the session?"
                confirmText="Yes, end session"
                isDanger={false}
            />

            {/* Session Evaluation Modal (Teacher) */}
            {sessionToEval && (
                <SessionEvaluationModal
                    isOpen={evalModalOpen}
                    onClose={() => {
                        setEvalModalOpen(false);
                        setSessionToEval(null);
                    }}
                    sessionId={sessionToEval.id}
                    studentId={sessionToEval.studentId}
                    onSubmitted={() => {
                        setEvalModalOpen(false);
                        setSessionToEval(null);
                        fetchSessions();
                    }}
                />
            )}
        </div>
    );
};

export default Schedule;
