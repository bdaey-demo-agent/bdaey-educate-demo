import React, { useState, useEffect } from 'react';
import { gamificationService, type LeaderboardEntryDto } from '../../services/gamificationService';
import { TrophyIcon, UserCircleIcon } from '@heroicons/react/24/solid';

const Leaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await gamificationService.getLeaderboard();
                setLeaderboard(data || []);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-primary-gold/30 border-t-primary-gold rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in font-body pb-12 w-full max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-4">
                    <TrophyIcon className="h-12 w-12 text-amber-500" />
                </div>
                <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-3">Leaderboard</h1>
                <p className="text-gray-500 text-lg">The most distinguished students earning points on their Quran memorization journey</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {leaderboard.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No data available right now.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {leaderboard.map((entry, index) => {
                            const isTop3 = index < 3;
                            let rankBadge = '';
                            let rankStyle = '';

                            if (index === 0) {
                                rankBadge = '🥇';
                                rankStyle = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                            } else if (index === 1) {
                                rankBadge = '🥈';
                                rankStyle = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
                            } else if (index === 2) {
                                rankBadge = '🥉';
                                rankStyle = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
                            } else {
                                rankBadge = `#${index + 1}`;
                                rankStyle = 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                            }

                            return (
                                <div
                                    key={entry.studentId}
                                    className={`p-6 flex items-center justify-between transition-colors ${isTop3 ? 'hover:bg-gray-50 dark:hover:bg-gray-750' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold text-lg border ${rankStyle}`}>
                                            {rankBadge}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {entry.profilePictureUrl ? (
                                                <img
                                                    src={entry.profilePictureUrl}
                                                    alt={entry.studentName}
                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                                />
                                            ) : (
                                                <UserCircleIcon className="w-12 h-12 sm:w-14 sm:h-14 text-gray-300 dark:text-gray-600" />
                                            )}

                                            <div>
                                                <h3 className={`font-bold text-gray-900 dark:text-white ${isTop3 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                                                    {entry.studentName}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`font-bold font-latin-heading ${isTop3 ? 'text-2xl sm:text-3xl text-primary-gold' : 'text-xl text-primary-green'}`}>
                                            {entry.totalPoints} <span className="text-sm font-normal text-gray-400">XP</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
