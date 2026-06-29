import api from './api';

export interface QuranSurah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
}

export interface QuranAyah {
    number: number;
    text: string;
    surah: QuranSurah;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean | Record<string, any>;
}

export interface QuranPageData {
    number: number; // page number 1-604
    ayahs: QuranAyah[];
    surahs: Record<string, QuranSurah>;
}

export interface QuranPageResponse {
    code: number;
    status: string;
    data: QuranPageData;
}

export interface SurahMeta {
    number: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
    revelationType: string;
}

// Global cache for pages to prevent redundant API calls during the session
const pageCache = new Map<number, QuranPageData>();
let surahsMetaCache: SurahMeta[] | null = null;

// Madinah Mushaf (Uthmani) Surah starting pages
export const SURAH_START_PAGES = [
    1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
    221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
    322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
    411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
    477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
    520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
    551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
    570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
    586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
    595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
    600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
    603, 604, 604, 604
];

class QuranService {
    private readonly baseUrl = '/Quran';

    /**
     * Fetch a specific page of the Quran (1-604) in Uthmani script.
     * Uses in-memory caching to avoid redundant network requests.
     */
    async getPage(pageNumber: number): Promise<QuranPageData> {
        if (pageNumber < 1 || pageNumber > 604) {
            throw new Error('Page number must be between 1 and 604');
        }

        if (pageCache.has(pageNumber)) {
            return pageCache.get(pageNumber)!;
        }

        try {
            const response = await api.get<QuranPageResponse>(`${this.baseUrl}/page/${pageNumber}`);
            const data = response.data.data;
            pageCache.set(pageNumber, data);

            // Pre-fetch next page silently for smoother UX if not at the end
            if (pageNumber < 604 && !pageCache.has(pageNumber + 1)) {
                this.prefetchPage(pageNumber + 1);
            }
            // Pre-fetch previous page silently
            if (pageNumber > 1 && !pageCache.has(pageNumber - 1)) {
                this.prefetchPage(pageNumber - 1);
            }

            return data;
        } catch (error) {
            console.error(`Error fetching Quran page ${pageNumber}:`, error);
            throw error;
        }
    }

    private async prefetchPage(pageNumber: number) {
        try {
            const response = await api.get<QuranPageResponse>(`${this.baseUrl}/page/${pageNumber}`);
            pageCache.set(pageNumber, response.data.data);
        } catch (error) {
            // Ignore prefetch errors
        }
    }

    /**
     * Fetch metadata for all 114 Surahs (used for dropdown/navigation).
     */
    async getAllSurahs(): Promise<SurahMeta[]> {
        if (surahsMetaCache) {
            return surahsMetaCache;
        }

        try {
            const response = await api.get<any>(`${this.baseUrl}/surahs`);
            surahsMetaCache = response.data.data || [];
            return surahsMetaCache as SurahMeta[];
        } catch (error) {
            console.error('Error fetching Surahs meta:', error);
            throw error;
        }
    }
}

export const quranService = new QuranService();
