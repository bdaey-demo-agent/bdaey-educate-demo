import React, { useState } from 'react';
import { useLocalParticipant, useScreenShare } from '@daily-co/daily-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../common/ConfirmModal';
import { toast } from 'react-hot-toast';
import sessionsService from '../../services/sessionsService';
import SessionEvaluationModal from './SessionEvaluationModal';
import { useAuth } from '../../context/AuthContext';
import {
    MicrophoneIcon,
    VideoCameraIcon,
    VideoCameraSlashIcon,
    PhoneXMarkIcon,
    ComputerDesktopIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';

interface ControlBarProps {
    sessionId: number;
    joinInfo: any;
    callObject: any;
    onToggleChat: () => void;
    onToggleParticipants: () => void;
    unreadChatCount?: number;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
    onToggleQuran?: () => void;
    isQuranOpen?: boolean;
}

const ControlBar: React.FC<ControlBarProps> = ({
    sessionId,
    joinInfo,
    callObject,
    onToggleChat,
    onToggleParticipants,
    unreadChatCount = 0,
    isFullscreen = false,
    onToggleFullscreen,
    onToggleQuran,
    isQuranOpen = false
}) => {
    const localParticipant = useLocalParticipant();
    const [confirmEndOpen, setConfirmEndOpen] = useState(false);
    const [evalModalOpen, setEvalModalOpen] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [evaluationSubmitted, setEvaluationSubmitted] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const isVideoEnabled = localParticipant?.video ?? false;
    const isAudioEnabled = localParticipant?.audio ?? false;
    const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

    const toggleVideo = () => callObject?.setLocalVideo(!isVideoEnabled);
    const toggleAudio = () => callObject?.setLocalAudio(!isAudioEnabled);

    const toggleScreenShare = () => {
        if (isSharingScreen) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    const handleLeave = async () => {
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (err) {
                console.log("Could not exit fullscreen", err);
            }
        }
        callObject?.leave();
        if (user?.role === 'Teacher') {
            navigate('/teacher/schedule');
        } else {
            navigate('/student/schedule');
        }
    };

    const handleEndSession = async () => {
        if (!sessionId) return;

        // Original logic ported from Classroom.tsx
        if (joinInfo?.scheduledAt && joinInfo?.durationMinutes) {
            const startDate = new Date(joinInfo.scheduledAt);
            const endTime = new Date(startDate.getTime() + joinInfo.durationMinutes * 60000);
            const now = new Date();

            const allowedEndTime = new Date(endTime.getTime() - 5 * 60000);

            if (now < allowedEndTime) {
                const remainingMs = allowedEndTime.getTime() - now.getTime();
                const remainingMinutes = Math.ceil(remainingMs / 60000);
                toast.error(`You cannot end the session yet. You can end it within 5 minutes of its scheduled end. (${remainingMinutes} min remaining)`);
                setConfirmEndOpen(false);
                return;
            }
        }

        try {
            await sessionsService.updateSessionStatus(sessionId, 'Completed');
            setConfirmEndOpen(false);

            // Exit fullscreen if active so the modal (which uses a Portal) is visible
            if (document.fullscreenElement) {
                try {
                    await document.exitFullscreen();
                } catch (err) {
                    console.log("Could not exit fullscreen", err);
                }
            }

            setSessionEnded(true);
            // Show evaluation modal instead of navigating immediately
            setEvalModalOpen(true);
        } catch (error) {
            console.error('Error ending session:', error);
            toast.error('Error ending the session');
            setConfirmEndOpen(false);
        }
    };

    const handleEvaluationSubmitted = () => {
        setEvalModalOpen(false);
        setEvaluationSubmitted(true);
        callObject?.leave();
        setTimeout(() => {
            navigate('/teacher/schedule');
        }, 500);
    };

    const handleEvalModalClose = () => {
        // Don't navigate — just close the modal and show re-prompt button
        setEvalModalOpen(false);
    };

    return (
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex flex-col items-center gap-4 relative z-10 w-full rounded-b-xl shadow-lg">

            {/* Floating re-prompt banner when session ended but evaluation not submitted */}
            {sessionEnded && !evaluationSubmitted && !evalModalOpen && (
                <div className="w-full flex items-center gap-3 bg-amber-900/80 border border-amber-500/50 text-amber-100 rounded-xl px-4 py-3 text-sm font-medium animate-pulse">
                    <span className="text-amber-400 text-xl">⚠️</span>
                    <span>You have not submitted the student session report yet!</span>
                    <button
                        onClick={() => setEvalModalOpen(true)}
                        className="mr-auto bg-amber-500 hover:bg-amber-400 text-amber-900 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                    >
                        Open Form
                    </button>
                </div>
            )}

            <div className="flex justify-center items-center gap-4 w-full">

                {/* Audio Toggle */}
                <button
                    onClick={toggleAudio}
                    title={isAudioEnabled ? "Mute" : "Unmute"}
                    className={`p-3.5 rounded-2xl transition-all flex items-center justify-center ${isAudioEnabled
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-500 ring-offset-2 ring-offset-gray-800'
                        }`}
                >
                    {isAudioEnabled ? (
                        <MicrophoneIcon className="w-6 h-6" />
                    ) : (
                        <MicrophoneIconSolid className="w-6 h-6" />
                    )}
                </button>

                {/* Video Toggle */}
                <button
                    onClick={toggleVideo}
                    title={isVideoEnabled ? "Stop Camera" : "Start Camera"}
                    className={`p-3.5 rounded-2xl transition-all flex items-center justify-center ${isVideoEnabled
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-500 ring-offset-2 ring-offset-gray-800'
                        }`}
                >
                    {isVideoEnabled ? (
                        <VideoCameraIcon className="w-6 h-6" />
                    ) : (
                        <VideoCameraSlashIcon className="w-6 h-6" />
                    )}
                </button>

                {/* Screen Share Toggle (Hidden by request) */}
                <button
                    onClick={toggleScreenShare}
                    title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
                    className={`p-3.5 rounded-2xl transition-all items-center justify-center hidden ${isSharingScreen
                        ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 ring-offset-gray-800 flex'
                        : 'bg-gray-700 hover:bg-gray-600 text-white flex'
                        }`}
                >
                    <ComputerDesktopIcon className="w-6 h-6" />
                </button>

                {/* Fullscreen Toggle */}
                {onToggleFullscreen && (
                    <button
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        className="p-3.5 rounded-2xl transition-all flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        {isFullscreen ? (
                            <ArrowsPointingInIcon className="w-6 h-6" />
                        ) : (
                            <ArrowsPointingOutIcon className="w-6 h-6" />
                        )}
                    </button>
                )}

                <div className="w-px h-10 bg-gray-700 mx-2 hidden sm:block"></div>

                {/* Quran Toggle */}
                {onToggleQuran && (
                    <button
                        onClick={onToggleQuran}
                        title={isQuranOpen ? "Close Quran" : "Open Quran"}
                        className={`p-3.5 rounded-2xl transition-all flex items-center justify-center ${isQuranOpen
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-800'
                            : 'bg-gray-700 hover:bg-gray-600 text-amber-500'
                            }`}
                    >
                        <BookOpenIcon className="w-6 h-6" />
                    </button>
                )}

                {/* Participants Toggle */}
                <button
                    onClick={onToggleParticipants}
                    title="Participants"
                    className="p-3.5 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white transition-all flex items-center justify-center"
                >
                    <UsersIcon className="w-6 h-6" />
                </button>

                {/* Chat Toggle */}
                <button
                    onClick={onToggleChat}
                    title="Side Chat"
                    className="p-3.5 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white transition-all flex items-center justify-center relative"
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    {unreadChatCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse border border-gray-800">
                            {unreadChatCount}
                        </span>
                    )}
                </button>

                <div className="flex-1"></div>

                {/* Leave Room */}
                <button
                    onClick={handleLeave}
                    title="Leave Session"
                    className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 font-medium"
                >
                    <PhoneXMarkIcon className="w-6 h-6" />
                    <span className="hidden sm:inline">Leave</span>
                </button>

                {/* End Session (Teacher Only) */}
                {user?.role === 'Teacher' && (
                    <button
                        onClick={async () => {
                            if (document.fullscreenElement) {
                                try {
                                    await document.exitFullscreen();
                                } catch (err) {
                                    console.log("Could not exit fullscreen", err);
                                }
                            }
                            setConfirmEndOpen(true);
                        }}
                        title="End Session Completely"
                        className="px-6 py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold ml-2 transition-colors shadow-lg shadow-red-500/30"
                    >
                        End (Teacher)
                    </button>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmEndOpen}
                onClose={() => setConfirmEndOpen(false)}
                onConfirm={handleEndSession}
                title="End Session"
                message="Are you sure you want to end the session for everyone? You will be taken to the evaluation screen afterwards."
                confirmText="Yes, End Session"
                isDanger={false}
            />

            <SessionEvaluationModal
                isOpen={evalModalOpen}
                onClose={handleEvalModalClose}
                sessionId={sessionId}
                studentId={joinInfo?.studentId || ''}
                onSubmitted={handleEvaluationSubmitted}
            />
        </div>
    );
};

export default ControlBar;
