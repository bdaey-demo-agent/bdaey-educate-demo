import React, { useEffect, useState, useRef } from 'react';
import { quranService, SURAH_START_PAGES } from '../../services/quranService';
import type { QuranPageData, SurahMeta } from '../../services/quranService';
import { ChevronRightIcon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface QuranPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isTeacher: boolean;
    // Sync state received from Daily.co
    syncPageNumber: number;
    // Callback to broadcast state to others (only useful for teacher)
    onPageChangeBroadcast: (pageNumber: number) => void;
    syncHighlightedAyah?: number | null;
    onAyahHighlightBroadcast?: (ayahNumber: number | null) => void;
}

const QuranPanel: React.FC<QuranPanelProps> = ({ isOpen, onClose, isTeacher, syncPageNumber, onPageChangeBroadcast, syncHighlightedAyah, onAyahHighlightBroadcast }) => {
    const [pageData, setPageData] = useState<QuranPageData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState<number>(syncPageNumber || 1);
    const [highlightedAyah, setHighlightedAyah] = useState<number | null>(syncHighlightedAyah ?? null);
    const [currentSurahId, setCurrentSurahId] = useState<number>(1);
    const [surahs, setSurahs] = useState<SurahMeta[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        quranService.getAllSurahs().then(setSurahs).catch(console.error);
    }, []);

    // Import Amiri Quran font just for this component if not globally imported
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);



    // Sync from Teacher
    useEffect(() => {
        if (!isTeacher && syncPageNumber && syncPageNumber !== currentPage) {
            setCurrentPage(syncPageNumber);
        }
    }, [syncPageNumber, isTeacher]);

    useEffect(() => {
        if (!isTeacher && syncHighlightedAyah !== highlightedAyah) {
            setHighlightedAyah(syncHighlightedAyah ?? null);
        }
    }, [syncHighlightedAyah, isTeacher]);

    // Load page data whenever currentPage changes
    useEffect(() => {
        const loadPage = async () => {
            setIsLoading(true);
            try {
                const data = await quranService.getPage(currentPage);
                setPageData(data);
                if (containerRef.current) {
                    containerRef.current.scrollTop = 0; // scroll to top on page change
                }
            } catch (error) {
                toast.error('Error fetching the Quran page');
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            loadPage();
        }
    }, [currentPage, isOpen]);

    const handleNextPage = () => {
        // Since Quran reads right to left, next page is technically page + 1 (left side)
        // But visually in Arabic "Next" usually means moving forward in the book (page + 1)
        if (currentPage < 604) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            if (isTeacher) onPageChangeBroadcast(newPage);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            if (isTeacher) onPageChangeBroadcast(newPage);
        }
    };

    if (!isOpen) return null;

    // Ayah End Symbol 
    const getAyahSymbol = (num: number) => {
        // Convert to Arabic numerals
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const numStr = num.toString().split('').map(d => arabicNumbers[parseInt(d)]).join('');
        return ` \u06DD${numStr} `; // ۝ symbol + number
    };

    // Determine current Surah name for header and update selector
    let currentSurahName = "";
    if (pageData && Array.isArray(pageData.ayahs) && pageData.ayahs.length > 0) {
        currentSurahName = pageData.ayahs[0].surah.name;
        // Sync the dropdown strictly with the currently viewed page's surah
        if (currentSurahId !== pageData.ayahs[0].surah.number) {
            setCurrentSurahId(pageData.ayahs[0].surah.number);
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-[#FDFBF7] text-[#1e293b] h-full w-full border-r border-amber-200 shadow-2xl relative z-30 overflow-hidden">
            {/* Header / Controls */}
            <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-1 hover:bg-amber-100 rounded text-gray-500 hover:text-red-500 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    {!isTeacher && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full border border-amber-200">Follow Mode (synced)</span>}
                </div>

                <div className="flex-1 flex justify-center items-center gap-2 md:gap-6 px-2">
                    {/* Navigation Prev (Page + 1 since right to left book) */}
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === 604 || (!isTeacher)}
                        className={`p-2 rounded-full ${(!isTeacher || currentPage === 604) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-amber-100 text-amber-700'}`}
                        title="Next page"
                    >
                        <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <div className="text-center min-w-[120px]">
                        <h3 className="font-bold text-lg sm:text-xl font-['Amiri'] text-amber-900">{currentSurahName}</h3>
                        <p className="text-xs font-medium text-amber-700 font-sans mt-0.5">Page {currentPage}</p>
                    </div>

                    {/* Navigation Next (Page - 1) */}
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1 || (!isTeacher)}
                        className={`p-2 rounded-full ${(!isTeacher || currentPage === 1) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-amber-100 text-amber-700'}`}
                        title="Previous page"
                    >
                        <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Surah Selector */}
                <div className="w-24 sm:w-32 lg:w-48 opacity-100 transition-opacity">
                    {isTeacher && surahs.length > 0 ? (
                        <select
                            className="w-full bg-white border border-amber-300 text-amber-900 text-xs sm:text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-1.5 sm:p-2 cursor-pointer"
                            value={currentSurahId}
                            onChange={(e) => {
                                const surahId = parseInt(e.target.value, 10);
                                const newPage = SURAH_START_PAGES[surahId - 1];
                                setCurrentSurahId(surahId);
                                setCurrentPage(newPage);
                                onPageChangeBroadcast(newPage);
                            }}
                        >
                            <option value="1" disabled className="hidden">Choose a surah...</option>
                            {surahs.map(s => {
                                return (
                                    <option key={s.number} value={s.number}>
                                        {s.number}. Surah {s.name.replace('سُورَةُ ', '')}
                                    </option>
                                );
                            })}
                        </select>
                    ) : (
                        <div className="w-10"></div>
                    )}
                </div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-x-0 inset-y-16 flex items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm z-10">
                    <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Quran Text Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 text-center relative"
                style={{ direction: 'rtl' }}
            >
                {pageData && (
                    <div
                        className="max-w-4xl mx-auto leading-loose md:leading-[2.5]"
                        style={{
                            fontFamily: "'Amiri Quran', serif",
                            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                            color: 'black'
                        }}
                    >
                        {/* Render Basmalah if it's the start of a surah (excluding Al-Tawba) */}
                        {Array.isArray(pageData.ayahs) && pageData.ayahs.length > 0 && pageData.ayahs[0].numberInSurah === 1 && pageData.ayahs[0].surah.number !== 1 && pageData.ayahs[0].surah.number !== 9 && (
                            <div className="text-center w-full mb-6 mt-4 text-emerald-800 text-[1.2em]">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </div>
                        )}

                        <p className="inline pb-8 text-center" style={{ textJustify: 'inter-word', textAlign: 'justify' }}>
                            {Array.isArray(pageData.ayahs) ? pageData.ayahs.map((ayah) => {
                                // The API includes the Basmalah in the first Ayah's text for Al-Fatiha, but for others it prefixes it loosely.
                                // We clean up the Basmalah prefix from the text if it's there (since we render it beautifully on top)
                                let text = ayah.text;
                                if (ayah.numberInSurah === 1 && ayah.surah.number !== 1 && text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ')) {
                                    text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
                                }

                                return (
                                    <React.Fragment key={ayah.number}>
                                        <span
                                            onClick={() => {
                                                if (!isTeacher) return;
                                                const newHighlight = highlightedAyah === ayah.number ? null : ayah.number;
                                                setHighlightedAyah(newHighlight);
                                                if (onAyahHighlightBroadcast) onAyahHighlightBroadcast(newHighlight);
                                            }}
                                            className={`transition-colors select-text ${isTeacher ? 'cursor-pointer' : ''} ${highlightedAyah === ayah.number ? 'bg-amber-100 text-amber-900 rounded px-1' : 'hover:text-emerald-700'}`}
                                        >
                                            {text}
                                        </span>
                                        <span className="text-amber-600 font-sans text-[0.6em] mx-1 inline-flex items-center justify-center select-none" style={{ fontFamily: 'sans-serif' }}>
                                            {getAyahSymbol(ayah.numberInSurah)}
                                        </span>
                                    </React.Fragment>
                                );
                            }) : null}
                        </p>

                        {/* Spacer to prevent control bar from covering text */}
                        <div className="w-full h-40 sm:h-56 flex-shrink-0"></div>
                    </div>
                )}
            </div>

            {/* Optional Footer/Decor */}
            <div className="bg-amber-50 absolute bottom-0 left-0 right-0 h-6 border-t border-amber-100 flex items-center justify-center">
                <p className="text-[10px] text-amber-600 font-['Amiri'] font-bold">Holy Quran - Uthmani script</p>
            </div>
        </div>
    );
};

export default QuranPanel;
