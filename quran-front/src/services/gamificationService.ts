import api from './api';

export interface BadgeDto {
    id: number;
    name: string;
    description: string;
    iconUrl: string;
    requiredPoints: number;
}

export interface StudentGamificationProfileDto {
    totalPoints: number;
    earnedBadges: BadgeDto[];
    nextBadgePoints: number;
    nextBadgeName?: string;
}

export interface LeaderboardEntryDto {
    studentId: string;
    studentName: string;
    profilePictureUrl?: string;
    totalPoints: number;
    rank: number;
}

const getMyProfile = async (): Promise<StudentGamificationProfileDto> => {
    const response = await api.get('/gamification/student/profile');
    return response.data;
};

const getLeaderboard = async (): Promise<LeaderboardEntryDto[]> => {
    const response = await api.get('/gamification/leaderboard');
    return response.data;
};

export const gamificationService = {
    getMyProfile,
    getLeaderboard
};
