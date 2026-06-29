import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

interface CustomAudioPlayerProps {
    src: string;
    className?: string;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src, className = '' }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Convert seconds to MM:SS format
    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        // Try to pre-load metadata
        if (audio.readyState > 0) {
            setDuration(audio.duration);
        }

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const progress = progressRef.current;
        if (!audio || !progress || duration === 0) return;

        // Calculate click position relative to the progress bar width
        const rect = progress.getBoundingClientRect();
        // Since the site is RTL, X coordinates start from the right usually, but getBoundingClientRect is LTR based.
        // Let's ensure calculations work in LTR for the mouse event.
        const clickPosition = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));

        audio.currentTime = percentage * duration;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`bg-gray-50 dark:bg-gray-800/80 rounded-full p-2 flex items-center gap-3 border border-gray-200 dark:border-gray-700 w-full max-w-lg shadow-sm ${className}`}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <PauseIcon className="h-5 w-5" />
                ) : (
                    <PlayIcon className="h-5 w-5 ml-1" /> // ml-1 to visually center the play triangle
                )}
            </button>

            {/* Progress Section */}
            <div className="flex-1 flex flex-col justify-center mx-2 group">
                <div
                    ref={progressRef}
                    onMouseDown={handleProgressClick}
                    className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
                >
                    <div
                        className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {/* Time Display */}
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium font-mono dir-ltr">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Mute Button */}
            <button
                type="button"
                onClick={toggleMute}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-colors focus:outline-none"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
                {isMuted ? (
                    <SpeakerXMarkIcon className="h-5 w-5" />
                ) : (
                    <SpeakerWaveIcon className="h-5 w-5" />
                )}
            </button>
        </div>
    );
};

export default CustomAudioPlayer;
