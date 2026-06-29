import React, { useRef, useEffect } from 'react';
import { useVideoTrack, useAudioTrack } from '@daily-co/daily-react';

interface VideoTileProps {
    participantId: string;
    isLocal: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ participantId, isLocal }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoState = useVideoTrack(participantId);
    const audioState = useAudioTrack(participantId);

    // Setup Video Track
    useEffect(() => {
        if (!videoRef.current || !videoState.persistentTrack) return;

        const track = videoState.persistentTrack;

        // Only set srcObject if it's new or changed
        if (videoRef.current.srcObject instanceof MediaStream) {
            const currentTracks = videoRef.current.srcObject.getTracks();
            if (currentTracks.length > 0 && currentTracks[0] === track) {
                return;
            }
        }

        videoRef.current.srcObject = new MediaStream([track]);
    }, [videoState.persistentTrack]);

    // Setup Audio Track
    useEffect(() => {
        if (isLocal) return; // Don't play own audio back
        if (!audioRef.current || !audioState.persistentTrack) return;

        const track = audioState.persistentTrack;

        if (audioRef.current.srcObject instanceof MediaStream) {
            const currentTracks = audioRef.current.srcObject.getTracks();
            if (currentTracks.length > 0 && currentTracks[0] === track) {
                return;
            }
        }

        audioRef.current.srcObject = new MediaStream([track]);
    }, [audioState.persistentTrack, isLocal]);

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">

            {/* Status Overlays */}
            <div className="absolute top-3 left-3 flex gap-2 z-10">
                {audioState.state === 'off' || audioState.state === 'blocked' ? (
                    <div className="bg-red-500/80 p-1.5 rounded text-white backdrop-blur-sm" title="المايكروفون مغلق">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10 2a3 3 0 00-3 3v4.755l-2.093 2.093A4.5 4.5 0 014.5 10.5v-1a.75.75 0 00-1.5 0v1a6 6 0 005.25 5.954V18h-2a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-2v-1.546A6 6 0 0017 10.5v-1a.75.75 0 00-1.5 0v1a4.5 4.5 0 01-.407 1.348L13 9.755V5a3 3 0 00-3-3zM8.5 5a1.5 1.5 0 113 0v3.255l-3 3V5zm2.868 6.99l-2.736-2.736L6.868 11.02A2.992 2.992 0 0010 12.5a2.986 2.986 0 001.368-.51z" clipRule="evenodd" />
                        </svg>
                    </div>
                ) : null}
            </div>

            {/* Video Element (Always Mounted for Stable Ref) */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''} ${videoState.state === 'playable' && videoState.persistentTrack ? 'opacity-100' : 'opacity-0'}`} // Mirror local video
            />

            {/* Fallback Icon when Video is off */}
            {!(videoState.state === 'playable' && videoState.persistentTrack) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-sm">الكاميرا مغلقة</span>
                </div>
            )}

            {/* Remote Audio Element */}
            {!isLocal && <audio autoPlay playsInline ref={audioRef} />}

            <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-md text-sm text-white backdrop-blur-sm truncate max-w-[80%] border border-white/10">
                {isLocal ? 'أنت' : 'مشارك'}
            </div>
        </div>
    );
};

export default VideoTile;
