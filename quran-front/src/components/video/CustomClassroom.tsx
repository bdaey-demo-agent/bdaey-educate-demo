import React, { useEffect, useCallback, useState } from 'react';
import { useDaily, useLocalParticipant, useParticipantIds, useScreenShare, useAppMessage } from '@daily-co/daily-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ControlBar from './ControlBar';
import VideoTile from './VideoTile';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import QuranPanel from './QuranPanel';
import { useAuth } from '../../context/AuthContext';
import { MicrophoneIcon, VideoCameraIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';

interface CustomClassroomProps {
    roomUrl: string;
    token: string;
    sessionId: number;
    displayName: string;
    joinInfo: any; // Keep ref to original info for end session logic
}

const CustomClassroom: React.FC<CustomClassroomProps> = ({ roomUrl, token, sessionId, displayName, joinInfo }) => {
    const callObject = useDaily();
    const navigate = useNavigate();
    const localParticipant = useLocalParticipant();
    const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
    const { screens } = useScreenShare();

    const [isJoining, setIsJoining] = useState(true);
    const [hasJoined, setHasJoined] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [pipPosition, setPipPosition] = useState({ x: 16, y: 16 }); // Default top-left
    const [isDraggingPip, setIsDraggingPip] = useState(false);
    const dragRef = React.useRef({ startX: 0, startY: 0, initialPipX: 0, initialPipY: 0 });

    const containerRef = React.useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const isTeacher = user?.role === 'Teacher';

    const [isQuranOpen, setIsQuranOpen] = useState(false);
    const [quranPage, setQuranPage] = useState(1);
    const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);

    // Custom In-Screen Notifications (for fullscreen support)
    const [quranRequest, setQuranRequest] = useState<{ id: string, name: string, fromId: string } | null>(null);
    const [quranNotification, setQuranNotification] = useState<{ message: string, type: 'success' | 'error', id: number } | null>(null);

    const showQuranNotification = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setQuranNotification({ message, type, id });
        setTimeout(() => {
            setQuranNotification(current => current?.id === id ? null : current);
        }, 5000);
    };

    // Track unread messages when chat is closed
    useAppMessage({
        onAppMessage: (e: any) => {
            if (e?.data?.type === 'chat' && !isChatOpen) {
                setUnreadChatCount((prev) => prev + 1);
            }
        }
    });

    // Handle Sync from teacher reliably
    useEffect(() => {
        if (!callObject) return;
        const handleAppMessage = (e: any) => {
            if (e?.data?.type === 'QURAN_SYNC' && !isTeacher) {
                // DON'T force isOpen on student. Only sync the page if they happen to have it open.
                // We let them open it manually.
                if (e.data.page !== undefined) setQuranPage(e.data.page);
                if (e.data.highlightedAyah !== undefined) setHighlightedAyah(e.data.highlightedAyah);
            }
            if (e?.data?.type === 'QURAN_REQUEST' && isTeacher) {
                setQuranRequest({
                    id: Math.random().toString(),
                    name: e.data.name,
                    fromId: e.fromId
                });
            }
            if (e?.data?.type === 'QURAN_APPROVED' && !isTeacher) {
                setIsQuranOpen(true);
                if (e.data.page !== undefined) setQuranPage(e.data.page);
                showQuranNotification('وافق المعلم على فتح المصحف.', 'success');
            }
            if (e?.data?.type === 'QURAN_REJECTED' && !isTeacher) {
                showQuranNotification('تم رفض طلب فتح المصحف بواسطة المعلم.', 'error');
            }
        };

        callObject.on('app-message', handleAppMessage);
        return () => {
            callObject.off('app-message', handleAppMessage);
        };
    }, [callObject, isTeacher]);

    // Send state to late joiners
    useEffect(() => {
        if (!callObject || !isTeacher) return;
        const handleParticipantJoined = (e: any) => {
            if (isQuranOpen) {
                callObject.sendAppMessage({
                    type: 'QURAN_SYNC',
                    isOpen: isQuranOpen,
                    page: quranPage,
                    highlightedAyah: highlightedAyah
                }, e.participant.session_id); // Send specifically to the new participant
            }
        };
        callObject.on('participant-joined', handleParticipantJoined);
        return () => {
            callObject.off('participant-joined', handleParticipantJoined);
        };
    }, [callObject, isTeacher, isQuranOpen, quranPage]);

    const broadcastQuranState = (isOpen: boolean, page: number, ayah: number | null = null) => {
        if (!isTeacher) return;
        callObject?.sendAppMessage({
            type: 'QURAN_SYNC',
            isOpen,
            page,
            highlightedAyah: ayah
        });
    };

    const handleToggleQuran = () => {
        if (!isTeacher) {
            callObject?.sendAppMessage({ type: 'QURAN_REQUEST', name: displayName || 'الطالب' });
            showQuranNotification('تم إرسال طلب بفتح المصحف للمعلم.', 'success');
            return;
        }

        const newState = !isQuranOpen;
        setIsQuranOpen(newState);
        broadcastQuranState(newState, quranPage);

        if (newState) {
            setIsChatOpen(false);
            setIsParticipantsOpen(false);
            // Handle fullscreen auto-lock
            if (!isFullscreen && !document.fullscreenElement) {
                handleToggleFullscreen().catch(err => {
                    console.log("Auto-fullscreen requires user gesture or is not supported in this context.", err);
                });
            }
        }
    };

    const handleQuranPageChange = (newPage: number) => {
        setQuranPage(newPage);
        setHighlightedAyah(null); // Reset highlight on page change
        broadcastQuranState(isQuranOpen, newPage, null);
    };

    const handleAyahHighlight = (ayahNumber: number | null) => {
        setHighlightedAyah(ayahNumber);
        broadcastQuranState(isQuranOpen, quranPage, ayahNumber);
    };

    const handleToggleChat = () => {
        setIsChatOpen(!isChatOpen);
        if (isParticipantsOpen) setIsParticipantsOpen(false);
        if (!isChatOpen) setUnreadChatCount(0); // Clear unread when opened
    };

    const handleToggleParticipants = () => {
        setIsParticipantsOpen(!isParticipantsOpen);
        if (isChatOpen) setIsChatOpen(false);
    };

    const handleToggleFullscreen = async () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            try {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
                // Lock screen to landscape on mobile if supported
                if (window.screen && window.screen.orientation && 'lock' in window.screen.orientation) {
                    try {
                        // Type assertion to any because typescript DOM lib might not have FullscreenOrientationLockType
                        await (window.screen.orientation as any).lock('landscape');
                    } catch (e) {
                        console.warn('Screen orientation lock failed or not supported:', e);
                    }
                }
            } catch (err) {
                console.error(`Error attempting to enable fullscreen: ${err}`);
                toast.error('لم نتمكن من تكبير الشاشة في هذا المتصفح.');
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
                setIsFullscreen(false);
                if (window.screen && window.screen.orientation && 'unlock' in window.screen.orientation) {
                    try {
                        window.screen.orientation.unlock();
                    } catch (e) {
                        console.warn('Screen orientation unlock failed:', e);
                    }
                }
            }
        }
    };

    // Listen for fullscreen escape key press
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto-hide controls disabled to prevent confusion on touchscreen laptops/mobiles
    // where clicking the screen (e.g. Quran panel) doesn't bring them back.
    useEffect(() => {
        // Controls remain visible by default.
    }, [showControls, hasJoined]);

    // Initial Camera setup before joining
    useEffect(() => {
        const setupCamera = async () => {
            if (!callObject) return;
            try {
                await callObject.startCamera();
                setIsJoining(false);
            } catch (err) {
                console.error("Failed to start camera for preview:", err);
                // If camera fails (e.g., permissions), we still allow them to see the pre-join, just no camera
                setIsJoining(false);
            }
        };
        setupCamera();
    }, [callObject]);

    const handleVideoAreaClick = () => {
        // Don't toggle controls if we just finished dragging the PiP
        if (isDraggingPip) return;

        // Toggle controls manually on click
        if (hasJoined) {
            setShowControls(prev => !prev);

            // Auto-trigger fullscreen on first interaction if not already fullscreen
            if (!isFullscreen && !document.fullscreenElement) {
                handleToggleFullscreen();
            }
        }
    };

    // --- PiP Drag Logic ---
    const handlePipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        setIsDraggingPip(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialPipX: pipPosition.x,
            initialPipY: pipPosition.y,
        };
    };

    const handlePipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingPip) return;
        e.stopPropagation();

        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        setPipPosition({
            x: dragRef.current.initialPipX + dx,
            y: dragRef.current.initialPipY + dy,
        });
    };

    const handlePipPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingPip) return;
        e.stopPropagation();

        const target = e.currentTarget;
        target.releasePointerCapture(e.pointerId);

        // Snap to nearest corner
        // Container roughly represents the window, so we compute distances
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        const containerHeight = containerRef.current?.clientHeight || window.innerHeight;

        const piPWidth = target.clientWidth;
        const piPHeight = target.clientHeight;

        const MARGIN = 16;

        // Calculate center of the PiP to determine Which quadrant it's in
        const pipCenterX = pipPosition.x + (piPWidth / 2);
        const pipCenterY = pipPosition.y + (piPHeight / 2);

        const isLeft = pipCenterX < (containerWidth / 2);
        const isTop = pipCenterY < (containerHeight / 2);

        // Calculate snapped positions
        const snappedX = isLeft ? MARGIN : containerWidth - piPWidth - MARGIN;
        const snappedY = isTop ? MARGIN : containerHeight - piPHeight - MARGIN;

        setPipPosition({ x: snappedX, y: snappedY });

        // Slight delay before turning off drag flag to prevent click-through
        setTimeout(() => setIsDraggingPip(false), 50);
    };

    const handleJoinClick = useCallback(async () => {
        if (!callObject) return;

        setIsJoining(true); // Show spinner while actually joining
        try {
            await callObject.join({
                url: roomUrl,
                token: token,
                userName: displayName,
                // audio/video will be inherited from the pre-join startCamera() permissions
            });
            setHasJoined(true);
            setIsJoining(false);

            // Auto-trigger fullscreen on first interaction for touch devices
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            if (isTouch && !isFullscreen && !document.fullscreenElement) {
                handleToggleFullscreen();
            }

        } catch (error) {
            console.error('Failed to join daily room:', error);
            toast.error('حدث خطأ أثناء الاتصال بقاعة الفيديو.');
            setIsJoining(false);
            navigate(-1);
        }
    }, [callObject, roomUrl, token, displayName, navigate, isFullscreen]);

    // Cleanup when leaving component
    useEffect(() => {
        return () => {
            if (callObject) {
                callObject.leave();
            }
        };
    }, [callObject]);

    useEffect(() => {
        if (!callObject) return;

        const handleError = (e: any) => {
            console.error('Daily Error:', e);
            toast.error(e?.errorMsg || 'حدث خطأ في قاعة الاجتماع');
        };

        callObject.on('error', handleError);

        return () => {
            callObject.off('error', handleError);
        };
    }, [callObject, navigate]);

    if (isJoining) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">جاري تحضير القاعة...</p>
            </div>
        );
    }

    const isVideoEnabled = localParticipant?.video ?? false;
    const isAudioEnabled = localParticipant?.audio ?? false;

    const toggleVideoPreview = () => callObject?.setLocalVideo(!isVideoEnabled);
    const toggleAudioPreview = () => callObject?.setLocalAudio(!isAudioEnabled);

    // Pre-join Screen Configuration
    if (!hasJoined) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white rounded-xl shadow-2xl p-4 md:p-8 relative overflow-y-auto overflow-x-hidden">
                <div className="w-full max-w-3xl flex flex-col items-center z-10 py-8 my-auto">
                    <h2 className="text-3xl font-bold mb-6 text-center">الاستعداد للدخول للقاعة</h2>

                    {/* Preview Video Box */}
                    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl mb-8 border-4 border-gray-800">
                        {localParticipant && (
                            <VideoTile
                                participantId={localParticipant.session_id}
                                isLocal={true}
                            />
                        )}

                        {/* Minimal Preview Controls Overlay */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-gray-700/50">
                            {/* Audio Toggle */}
                            <button
                                onClick={toggleAudioPreview}
                                title={isAudioEnabled ? "كتم الصوت" : "تشغيل الصوت"}
                                className={`p-4 rounded-full transition-all flex items-center justify-center ${isAudioEnabled
                                    ? 'bg-gray-700/80 hover:bg-gray-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-500 ring-offset-2 ring-offset-black'
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
                                onClick={toggleVideoPreview}
                                title={isVideoEnabled ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
                                className={`p-4 rounded-full transition-all flex items-center justify-center ${isVideoEnabled
                                    ? 'bg-gray-700/80 hover:bg-gray-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-500 ring-offset-2 ring-offset-black'
                                    }`}
                            >
                                {isVideoEnabled ? (
                                    <VideoCameraIcon className="w-6 h-6" />
                                ) : (
                                    <VideoCameraSlashIcon className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleJoinClick}
                        className="px-10 py-4 bg-primary hover:bg-primary-hover text-white text-xl font-bold rounded-xl shadow-[0_0_20px_rgba(33,150,243,0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                        دخول القاعة الآن
                    </button>
                    <p className="mt-4 text-sm text-gray-400 text-center">يرجى التأكد من تشغيل الكاميرا والميكروفون والموافقة على الصلاحيات المطلوبة</p>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
            </div>
        );
    }

    // Determine layout mode based on screen sharing
    const hasScreenShare = screens && screens.length > 0;
    const activeScreen = hasScreenShare ? screens[0] : null;

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col w-full h-full bg-gray-900 text-white overflow-hidden rounded-xl shadow-2xl"
        >
            {/* Header info overlays can go here if needed */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-sm z-10 border border-white/10">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    غرفة الجلسة
                </span>
            </div>

            {/* In-Container Notifications for Fullscreen Support */}
            {quranNotification && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-xl border text-sm font-bold animate-fade-in-down max-w-sm text-center ${quranNotification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100' : 'bg-red-900/90 border-red-500/50 text-red-100'}`}>
                    {quranNotification.message}
                </div>
            )}

            {/* In-Container Request Dialog for Fullscreen Support */}
            {quranRequest && isTeacher && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-600 shadow-2xl rounded-xl p-4 w-80 animate-fade-in-down">
                    <div className="flex flex-col gap-3 font-sans">
                        <span className="font-bold text-lg text-white">طلب فتح المصحف</span>
                        <span className="text-sm text-gray-300">يطلب المشارك <strong className="text-amber-400">{quranRequest.name}</strong> فتح المصحف المشترك. هل توافق؟</span>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => {
                                setIsQuranOpen(true);
                                callObject?.sendAppMessage({ type: 'QURAN_APPROVED', page: quranPage });
                                setQuranRequest(null);
                            }} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold flex-1 transition-colors">موافقة وفتح</button>
                            <button onClick={() => {
                                callObject?.sendAppMessage({ type: 'QURAN_REJECTED' }, quranRequest.fromId);
                                setQuranRequest(null);
                            }} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg text-sm font-bold flex-1 transition-colors">رفض</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen || isParticipantsOpen ? 'mr-0 sm:mr-80' : ''}`}>

                    {/* Screen Share View */}
                    {(hasScreenShare && activeScreen) && (
                        <div className="flex-1 p-4 pb-0 flex items-center justify-center min-h-[60%]">
                            <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-xl border border-gray-700">
                                <video
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain"
                                    ref={(videoEl) => {
                                        if (videoEl && activeScreen.screenVideo.persistentTrack) { // @ts-ignore
                                            videoEl.srcObject = new MediaStream([activeScreen.screenVideo.persistentTrack]);
                                        }
                                    }}
                                />
                                <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 backdrop-blur-md">
                                    مشاركة شاشة
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video Area */}
                    <div
                        className="flex-1 w-full h-full relative"
                        onClick={handleVideoAreaClick}
                    >
                        {remoteParticipantIds.length === 0 && !hasScreenShare && !isQuranOpen ? (
                            // ALONE IN ROOM: Center Local Participant
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                {localParticipant && (
                                    <div className="w-full h-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800">
                                        <VideoTile
                                            participantId={localParticipant.session_id}
                                            isLocal={true}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            // PARTICIPANTS PRESENT: Picture-in-Picture Layout
                            <>
                                {/* Remote Participants (Fill Background) */}
                                <div className="absolute inset-0 z-0">
                                    {remoteParticipantIds.map((id) => (
                                        <VideoTile
                                            key={id}
                                            participantId={id}
                                            isLocal={false}
                                        />
                                    ))}
                                </div>

                                {/* Local Participant (Little Floating Box) */}
                                {localParticipant && (
                                    <div
                                        className={`absolute w-28 h-40 sm:w-48 sm:h-64 z-20 shadow-2xl rounded-xl overflow-hidden bg-gray-900 ${!isDraggingPip ? 'transition-all duration-300' : ''} hover:scale-105 cursor-grab active:cursor-grabbing`}
                                        style={{
                                            left: `${pipPosition.x}px`,
                                            top: `${pipPosition.y}px`,
                                            touchAction: 'none' // Prevent scrolling on mobile while dragging
                                        }}
                                        onPointerDown={handlePipPointerDown}
                                        onPointerMove={handlePipPointerMove}
                                        onPointerUp={handlePipPointerUp}
                                        onPointerCancel={handlePipPointerUp}
                                    >
                                        <div className="absolute inset-0 z-30 opacity-0"></div> {/* Invisible overlay for easier drag handle without interfering with video controls if any */}
                                        <VideoTile
                                            participantId={localParticipant.session_id}
                                            isLocal={true}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Side Panels */}
                <ChatPanel
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    callObject={callObject}
                />

                <ParticipantsPanel
                    isOpen={isParticipantsOpen}
                    onClose={() => setIsParticipantsOpen(false)}
                />

                <div className={`h-full transition-all duration-300 z-10 flex-shrink-0 bg-gray-900 border-r border-gray-700 ${isQuranOpen ? 'w-full sm:w-[50vw] lg:w-[600px] xl:w-[700px]' : 'w-0 overflow-hidden border-none'}`}>
                    <QuranPanel
                        isOpen={isQuranOpen}
                        onClose={() => {
                            setIsQuranOpen(false);
                            if (isTeacher) broadcastQuranState(false, quranPage, null);
                        }}
                        isTeacher={isTeacher}
                        syncPageNumber={quranPage}
                        syncHighlightedAyah={highlightedAyah}
                        onPageChangeBroadcast={handleQuranPageChange}
                        onAyahHighlightBroadcast={handleAyahHighlight}
                    />
                </div>
            </div>

            {/* Bottom Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
                <ControlBar
                    sessionId={sessionId}
                    joinInfo={joinInfo}
                    callObject={callObject}
                    onToggleChat={handleToggleChat}
                    onToggleParticipants={handleToggleParticipants}
                    unreadChatCount={unreadChatCount}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                    isQuranOpen={isQuranOpen}
                    onToggleQuran={handleToggleQuran}
                />
            </div>
        </div>
    );
};

export default CustomClassroom;
