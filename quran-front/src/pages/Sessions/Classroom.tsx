import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DailyProvider } from '@daily-co/daily-react';
import DailyIframe from '@daily-co/daily-js';
import { videoService } from '../../services/videoService';
import type { VideoJoinInfo } from '../../services/videoService';
import { toast } from 'react-hot-toast';
import { signalRService } from '../../services/signalrService';
import CustomClassroom from '../../components/video/CustomClassroom';

const Classroom: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [joinInfo, setJoinInfo] = useState<VideoJoinInfo | null>(null);

    // Create a singleton call object for the provider
    const callObject = useMemo(() => {
        return DailyIframe.createCallObject();
    }, []);

    useEffect(() => {
        const initCall = async () => {
            if (!sessionId) return;

            const isSecure = window.isSecureContext || window.location.hostname === 'localhost';

            if (!isSecure) {
                toast.error('Video calls require a secure (HTTPS) connection to use the camera and microphone.');
                navigate(-1);
                return;
            }

            const support = DailyIframe.supportedBrowser();
            if (!support.supported) {
                console.warn('[Daily] Browser support check returned false.');
                toast('Note: this browser may have issues in the classroom.', { icon: '⚠️' });
            }

            try {
                const info = await videoService.getJoinInfo(parseInt(sessionId));
                setJoinInfo(info);
                setLoading(false);
            } catch (error: any) {
                console.error('Failed to get join info:', error);

                let errorMessage = 'Failed to join the classroom';
                if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                }

                toast.error(errorMessage, { duration: 6000 });
                navigate(-1);
                setLoading(false);
            }
        };

        initCall();

        return () => {
            if (callObject) {
                callObject.destroy();
            }
        };
    }, [sessionId, navigate, callObject]);

    useEffect(() => {
        const handleDisconnect = (disconnectedSessionId: any) => {
            if (disconnectedSessionId && String(disconnectedSessionId) === String(sessionId)) {
                toast.error('You signed in from another device. This session will close here.', { duration: 5000 });
                callObject?.leave();
                navigate('/');
            }
        };

        signalRService.on('ForceDisconnect', handleDisconnect);
        return () => {
            signalRService.off('ForceDisconnect', handleDisconnect);
        };
    }, [sessionId, navigate, callObject]);

    return (
        <DailyProvider callObject={callObject}>
            <div className="flex flex-col h-[calc(100vh-8rem)] w-full bg-gray-900 text-white overflow-hidden p-2 sm:p-4 rounded-xl shadow-xl">
                {/* Header inside Classroom wrapper or just let CustomClassroom dictate styling */}
                <div className="mb-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors border border-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-lg">Session Stream</h1>
                        {joinInfo && <p className="text-xs text-gray-400">Welcome, {joinInfo.displayName}</p>}
                    </div>
                </div>

                <div className="flex-1 w-full relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-gray-400 font-medium animate-pulse">Preparing the room...</p>
                            </div>
                        </div>
                    ) : joinInfo ? (
                        <CustomClassroom
                            roomUrl={joinInfo.roomUrl}
                            token={joinInfo.token}
                            sessionId={parseInt(sessionId!)}
                            displayName={joinInfo.displayName}
                            joinInfo={joinInfo}
                        />
                    ) : null}
                </div>
            </div>
        </DailyProvider>
    );
};

export default Classroom;
