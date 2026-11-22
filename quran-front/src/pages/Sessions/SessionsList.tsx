import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import sessionsService from '../../services/sessionsService';
import { videoService } from '../../services/videoService';
import { Link, useNavigate } from 'react-router-dom';
import type { Session } from '../../types/session';
import { CalendarIcon, UserIcon, VideoCameraIcon, CheckCircleIcon, LinkIcon, PlayIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

import ConfirmModal from '../../components/common/ConfirmModal';
import SessionEvaluationModal from '../../components/video/SessionEvaluationModal';

const SessionsList: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [linkInput, setLinkInput] = useState('');

    const [confirmEndOpen, setConfirmEndOpen] = useState(false);
    const [sessionToEnd, setSessionToEnd] = useState<number | null>(null);
    const [sessionToEval, setSessionToEval] = useState<Session | null>(null);
    const [evalModalOpen, setEvalModalOpen] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionsService.getMySessions();
            setSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async (session: Session) => {
        try {
            // 1. Prepare Room
            toast.loading('Preparing the classroom...', { id: 'prepare-room' });
            await videoService.prepareRoom(session.id);

            // 2. Update status to InProgress
            await sessionsService.updateSessionStatus(session.id, 'InProgress');

            toast.success('Classroom ready', { id: 'prepare-room' });

            // 3. Navigate to classroom
            navigate(`/teacher/classroom/${session.id}`);
        } catch (error) {
            console.error('Error starting session:', error);
            toast.error('Error starting the session', { id: 'prepare-room' });
        }
    };

    const confirmEndSession = async () => {
        if (!sessionToEnd) return;
        try {
            await sessionsService.updateSessionStatus(sessionToEnd, 'Completed');
            loadSessions();
            toast.success('Session ended');

            if (isTeacher && sessionToEval) {
                setEvalModalOpen(true);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error ending the session');
        } finally {
            setConfirmEndOpen(false);
            setSessionToEnd(null);
        }
    };

    const handleEndClick = (session: Session) => {
        setSessionToEnd(session.id);
        setSessionToEval(session);
        setConfirmEndOpen(true);
    };

    const openLinkModal = (session: Session) => {
        setSelectedSessionId(session.id);
        setLinkInput(session.roomUrl || '');
        setLinkModalOpen(true);
    };

    const handleSaveLink = async () => {
        if (!selectedSessionId) return;
        try {
            await sessionsService.updateSessionLink(selectedSessionId, linkInput);
            setLinkModalOpen(false);
            loadSessions();
            toast.success('Link saved');
        } catch (error) {
            console.error('Error saving link:', error);
            toast.error('Error saving the link');
        }
    };

    const relevantSessions = sessions.filter(s => {
        if (activeTab === 'upcoming') {
            return ['Scheduled', 'InProgress'].includes(s.status);
        } else {
            return ['Completed', 'Cancelled', 'NoShow'].includes(s.status);
        }
    });

    const isTeacher = user?.role === 'Teacher';

    const getStatusBadge = (status: string) => {
        const statusConfig: any = {
            'Scheduled': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Scheduled' },
            'InProgress': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Live Now' },
            'Completed': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Completed' },
            'Cancelled': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
        };
        const config = statusConfig[status] || statusConfig.Scheduled;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    My Sessions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Session schedule and status
                    <span className="text-xs text-blue-500 mx-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        (🕒 Times below are in your local timezone)
                    </span>
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'upcoming'
                        ? 'text-gold-600 border-b-2 border-gold-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    Upcoming / Live
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'history'
                        ? 'text-gold-600 border-b-2 border-gold-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    History
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : relevantSessions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No sessions in this list</p>
                    </div>
                ) : (
                    relevantSessions.map(session => (
                        <div key={session.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                            {/* Info */}
                            <div className="flex items-start gap-4">
                                <div className="hidden md:flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg w-16 h-16 text-center p-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {new Date(session.scheduledAt).toLocaleDateString('en-GB', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        {new Date(session.scheduledAt).getDate()}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isTeacher ? session.studentName : session.teacherName}
                                        </h3>
                                        {getStatusBadge(session.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="h-4 w-4" />
                                            {new Date(session.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <UserIcon className="h-4 w-4" />
                                            {session.durationMinutes} min
                                        </span>
                                    </div>
                                    {/* Show link if exists (Internal or External) */}
                                    {session.roomUrl && (
                                        <Link
                                            to={isTeacher ? `/teacher/classroom/${session.id}` : `/student/classroom/${session.id}`}
                                            className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <VideoCameraIcon className="h-4 w-4" />
                                            Join Classroom
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 w-full md:w-auto">

                                {isTeacher && (
                                    <>
                                        <button
                                            onClick={() => openLinkModal(session)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            {session.roomUrl ? 'Edit Link' : 'Add Link'}
                                        </button>

                                        {session.status === 'Scheduled' && (
                                            <button
                                                onClick={() => handleStartSession(session)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                                            >
                                                <PlayIcon className="h-4 w-4" />
                                                Start Session
                                            </button>
                                        )}

                                        {session.status === 'InProgress' && (
                                            <button
                                                onClick={() => handleEndClick(session)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" />
                                                End Session
                                            </button>
                                        )}

                                        {session.status === 'Completed' && !session.hasEvaluation && (
                                            <button
                                                onClick={() => {
                                                    setSessionToEval(session);
                                                    setEvalModalOpen(true);
                                                }}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition shadow-sm animate-pulse"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" />
                                                Submit Session Report
                                            </button>
                                        )}
                                    </>
                                )}

                                {!isTeacher && (
                                    session.status === 'InProgress' ? (
                                        <Link
                                            to={`/student/classroom/${session.id}`}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition animate-pulse shadow-lg"
                                        >
                                            <VideoCameraIcon className="h-4 w-4" />
                                            Join Now
                                        </Link>
                                    ) : (
                                        session.status === 'Scheduled' && (
                                            <div className="flex-1 md:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium text-center">
                                                Waiting for the teacher...
                                            </div>
                                        )
                                    )
                                )}

                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Link Modal */}
            {linkModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Add Meeting Link</h3>
                        <input
                            type="text"
                            placeholder="https://meet.google.com/..."
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setLinkModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLink}
                                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* End Session Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmEndOpen}
                onClose={() => setConfirmEndOpen(false)}
                onConfirm={confirmEndSession}
                title="End Session"
                message="Are you sure you want to end the session?"
                confirmText="Yes, End Session"
                isDanger={false}
            />

            {/* Evaluation Modal */}
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
                        loadSessions();
                    }}
                />
            )}
        </div>
    );
};

export default SessionsList;
