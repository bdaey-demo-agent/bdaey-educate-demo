export const queryKeys = {
    bookings: {
        all: ['bookings'] as const,
        list: (filters: Record<string, any> = {}) => [...queryKeys.bookings.all, 'list', filters] as const,
        details: (id: number) => [...queryKeys.bookings.all, 'details', id] as const,
        my: ['bookings', 'my'] as const,
        teacher: ['bookings', 'teacher'] as const,
    },
    packages: {
        all: ['packages'] as const,
        list: (filters: Record<string, any> = {}) => [...queryKeys.packages.all, 'list', filters] as const,
        details: (id: number) => [...queryKeys.packages.all, 'details', id] as const,
        active: ['packages', 'active'] as const,
    },
    profile: {
        all: ['profile'] as const,
        me: ['profile', 'me'] as const,
        byId: (id: number) => ['profile', id] as const,
    },
    sessions: {
        all: ['sessions'] as const,
        my: ['sessions', 'my'] as const,
        schedule: (userId: string | undefined, range: { start: string, end: string }) => [...queryKeys.sessions.all, 'schedule', userId, range] as const,
    },
    teachers: {
        all: ['teachers'] as const,
        list: ['teachers', 'list'] as const,
        details: (id: number) => ['teachers', 'details', id] as const,
        pending: ['teachers', 'pending'] as const,
    },
    students: {
        all: ['students'] as const,
        my: ['students', 'my'] as const,
    },
    wallet: {
        all: ['wallet'] as const,
        my: ['wallet', 'my'] as const,
        balance: ['wallet', 'balance'] as const,
    }
};
