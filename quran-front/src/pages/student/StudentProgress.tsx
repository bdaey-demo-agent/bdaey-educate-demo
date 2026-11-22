import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { sessionEvaluationService } from '../../services/sessionEvaluationService';
import { ChartBarIcon, DocumentTextIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

const StudentProgress: React.FC = () => {
    const { user } = useAuth();

    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvaluations = async () => {
            if (!user?.id) return;
            try {
                const data = await sessionEvaluationService.getStudentEvaluations(user.id);
                setEvaluations(data || []);
            } catch (error) {
                console.error("Error fetching evaluations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvaluations();
    }, [user?.id]);

    const averageRating = evaluations.length > 0
        ? evaluations.reduce((sum, ev) => sum + ev.evaluationScore, 0) / evaluations.length
        : 0;

    const totalHifz = evaluations.filter(e => e.memorizedSurah && e.memorizedSurah.trim() !== '').length;
    const totalRevision = evaluations.filter(e => e.revisedSurah && e.revisedSurah.trim() !== '').length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in font-body pb-12">
            <h1 className="text-3xl font-heading font-bold text-primary-gold mb-2">My Learning Record</h1>
            <p className="text-text-secondary text-lg mb-8">
                Track your progress, review what you have memorized, and read teacher feedback to improve your level.
            </p>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-3">
                        <CheckBadgeIcon className="w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{evaluations.length}</p>
                    <p className="text-sm text-gray-500">Completed, rated sessions</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mb-3">
                        <StarIcon className="w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{averageRating.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5</span></p>
                    <p className="text-sm text-gray-500">Average teacher rating</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{totalHifz}</p>
                    <p className="text-sm text-gray-500">New memorization records</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-3">
                        <DocumentTextIcon className="w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{totalRevision}</p>
                    <p className="text-sm text-gray-500">Review records</p>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                    Past Session History
                </h2>

                {evaluations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClockIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No rated sessions yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Your achievements will appear here after you complete sessions with teachers.</p>
                    </div>
                ) : (
                    <div className="relative border-r-2 border-primary/20 pr-6 mr-3 space-y-10">
                        {evaluations.map((ev) => (
                            <div key={ev.id} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute w-4 h-4 bg-primary rounded-full -right-[31px] top-6 border-4 border-white dark:border-gray-800 shadow-sm"></div>

                                <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Session with teacher: {ev.teacherName}</h3>
                                                <span className="text-xs font-medium bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-gray-500 border border-gray-200 dark:border-gray-600 shadow-sm">
                                                    {new Date(ev.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                            </div>

                                            <div className="flex gap-1 mt-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    ev.evaluationScore >= star
                                                        ? <StarIcon key={star} className="w-4 h-4 text-amber-400" />
                                                        : <StarOutlineIcon key={star} className="w-4 h-4 text-gray-300" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {ev.memorizedSurah && (
                                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                                                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wider">New Memorization</h4>
                                                <p className="text-gray-800 dark:text-gray-200 font-medium whitespace-break-spaces">
                                                    <span className="text-blue-600 dark:text-blue-500 font-bold ml-1">Surah:</span> {ev.memorizedSurah}
                                                    {(ev.memorizedAyahFrom || ev.memorizedAyahTo) && (
                                                        <span className="text-gray-600 dark:text-gray-400 text-sm block mt-1">
                                                            Ayahs: from {ev.memorizedAyahFrom || '-'} to {ev.memorizedAyahTo || '-'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {ev.revisedSurah && (
                                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                                                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wider">Reviewed Material</h4>
                                                <p className="text-gray-800 dark:text-gray-200 font-medium whitespace-break-spaces">
                                                    <span className="text-emerald-600 dark:text-emerald-500 font-bold ml-1">Surah:</span> {ev.revisedSurah}
                                                    {(ev.revisedAyahFrom || ev.revisedAyahTo) && (
                                                        <span className="text-gray-600 dark:text-gray-400 text-sm block mt-1">
                                                            Ayahs: from {ev.revisedAyahFrom || '-'} to {ev.revisedAyahTo || '-'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {ev.teacherNotes && (
                                        <div className="bg-white dark:bg-gray-800/60 p-4 rounded-xl border-l-4 border-l-primary shadow-sm relative">
                                            <svg className="absolute top-4 left-4 w-6 h-6 text-gray-200 dark:text-gray-700 rotate-180 transform opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" /></svg>
                                            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Teacher Notes</h4>
                                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                                {ev.teacherNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProgress;
