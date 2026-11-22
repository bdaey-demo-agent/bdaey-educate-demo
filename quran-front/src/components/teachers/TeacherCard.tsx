import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, HeartIcon as HeartIconSolid, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline, PlayCircleIcon } from '@heroicons/react/24/outline';
import type { Teacher } from '../../types/teacher';

interface TeacherCardProps {
    teacher: Teacher;
    isFavorite: boolean;
    onToggleFavorite: (id: number) => void;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, isFavorite, onToggleFavorite }) => {

    // Audio Hover Feature State & Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    // Initialize audio object if audio source exists
    useEffect(() => {
        if (teacher.audioSampleUrl && teacher.showAudioSample !== false) {
            audioRef.current = new Audio(teacher.audioSampleUrl);
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('ended', handleAudioEnded);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                audioRef.current.removeEventListener('ended', handleAudioEnded);
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [teacher.audioSampleUrl, teacher.showAudioSample]);

    const handleTimeUpdate = () => {
        if (audioRef.current && audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (audioRef.current && !isPlaying) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => {
                // Ignore NotAllowedError (user didn't interact yet) to prevent console spam
                if (e.name !== 'NotAllowedError') {
                    console.warn('Audio preview error:', e);
                }
            });
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            // Optional: reset to beginning or let it resume next hover
            // audioRef.current.currentTime = 0; 
            // setProgress(0);
        }
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(teacher.id);
    };

    const hasAudio = teacher.audioSampleUrl && teacher.showAudioSample !== false;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full group relative">

            {/* Favorites Button (Absolute Top Left) */}
            <button
                onClick={handleToggleFavorite}
                className="absolute top-3 left-3 z-30 p-2 bg-white/50 backdrop-blur-md hover:bg-white/80 dark:bg-gray-900/50 dark:hover:bg-gray-900/80 rounded-full transition-colors shadow-sm"
                aria-label="Toggle Favorite"
            >
                {isFavorite ? (
                    <HeartIconSolid className="h-5 w-5 text-red-500 transform scale-110 transition-transform" />
                ) : (
                    <HeartIconOutline className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors" />
                )}
            </button>

            {/* Image Section with Audio Hover */}
            <div
                className="relative h-48 w-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* The Teacher Image */}
                <img
                    src={teacher.imageUrl}
                    alt={teacher.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isHovered && hasAudio ? 'scale-110 blur-[2px] brightness-75' : 'group-hover:scale-105'}`}
                />

                {/* Online Indicator Badge */}
                {teacher.isOnline !== false && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-sm z-10 border border-green-100 dark:border-green-900/50">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Available Now</span>
                    </div>
                )}

                {/* Audio Hover Ring Overlay */}
                {hasAudio && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100 z-20' : 'opacity-0'}`}>
                        {/* SVG Circular Progress Ring */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                                <circle
                                    cx="40" cy="40" r="36"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-white/30 dark:text-gray-800/50"
                                />
                                <circle
                                    cx="40" cy="40" r="36"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 36}
                                    strokeDashoffset={2 * Math.PI * 36 - ((progress / 100) * (2 * Math.PI * 36))}
                                    className="text-primary-500 transition-all duration-100 ease-linear"
                                    strokeLinecap="round"
                                />
                            </svg>
                            {/* Play/Pause Icon inside Ring */}
                            <div className="bg-primary-600/90 backdrop-blur-sm text-white rounded-full p-2.5 shadow-lg transform scale-110">
                                {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6 ml-0.5" />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Badge (Bottom Right over image) */}
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm z-10">
                    <StarIcon className="h-4 w-4 text-gold-500" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{teacher.rating}</span>
                    <span className="text-[10px] text-gray-500">({teacher.reviewCount})</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Title & Name */}
                <div className="mb-2">
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 block mb-1">{teacher.title}</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{teacher.name}</h3>
                </div>

                {/* Social Proof (Students / Sessions) */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400 font-medium h-4">
                    {hasAudio && !isHovered && (
                        <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                            <PlayCircleIcon className="h-3.5 w-3.5" />
                            <span>Voice Intro</span>
                        </div>
                    )}
                </div>

                {/* Subjects Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {teacher.subjects.map((sub, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gold-500/10 text-gold-600 dark:text-gold-400 text-xs rounded-full font-medium">
                            {sub}
                        </span>
                    ))}
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                    {teacher.bio}
                </p>

                {/* Pricing & Action */}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Packages start at</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {teacher.minPackagePrice ?? teacher.priceStart} <span className="text-xs font-normal text-gray-500">{teacher.currency}</span>
                        </span>
                    </div>

                    <Link
                        to={`/teacher/${teacher.userName || teacher.user?.userName || teacher.id}`}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                    >
                        View Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TeacherCard;
