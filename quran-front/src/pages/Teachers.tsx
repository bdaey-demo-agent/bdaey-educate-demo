import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import TeacherCard from '../components/teachers/TeacherCard';
import TeacherCardSkeleton from '../components/teachers/TeacherCardSkeleton';
import teacherService from '../services/teacherService';
import type { Teacher } from '../types/teacher';
import { useAuth } from '../context/AuthContext';
import GuestBanner from '../components/common/GuestBanner';

const Teachers: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Advanced Filtering & Sorting State
    const [gender, setGender] = useState('الكل');
    const [isOnline, setIsOnline] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]); // min, max
    const [minRating, setMinRating] = useState<number>(0);
    const [sortBy, setSortBy] = useState('rating'); // Default sort
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Favorites filtering
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

    useEffect(() => {
        if (isAuthenticated) {
            teacherService.getFavorites().then(setFavoriteIds).catch(console.error);
        } else {
            setFavoriteIds([]);
            setShowFavoritesOnly(false); // Reset if user logs out
        }
    }, [isAuthenticated]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 12; // Number of teachers per page

    // Debounce search term to prevent excessive API calls
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Handle cross-tab or component favorites update trigger
    useEffect(() => {
        const handleFavoritesChanged = () => {
            if (showFavoritesOnly) {
                setRefreshKey(prev => prev + 1);
            }
        };
        window.addEventListener('favorites_changed', handleFavoritesChanged);
        return () => window.removeEventListener('favorites_changed', handleFavoritesChanged);
    }, [showFavoritesOnly]);

    useEffect(() => {
        // Reset to page 1 when category, gender, online, rating, sort, or favorites changes
        setCurrentPage(1);
    }, [selectedCategory, gender, isOnline, minRating, priceRange, sortBy, showFavoritesOnly]);

    const handleToggleFavorite = async (id: number) => {
        if (!isAuthenticated) {
            toast.error('يجب تسجيل الدخول لإضافة المعلم للمفضلة');
            return;
        }

        // Optimistic UI update
        const isFav = favoriteIds.includes(id);
        setFavoriteIds(prev => isFav ? prev.filter(fId => fId !== id) : [...prev, id]);

        try {
            await teacherService.toggleFavorite(id);
            if (showFavoritesOnly) {
                // Refresh list if we are currently filtering by favorites and just removed one
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            // Revert on failure
            setFavoriteIds(prev => !isFav ? prev.filter(fId => fId !== id) : [...prev, id]);
            toast.error('حدث خطأ أثناء تحديث المفضلة');
        }
    };

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                if (showFavoritesOnly && !isAuthenticated) {
                    setTeachers([]);
                    setTotalCount(0);
                    setTotalPages(1);
                    return;
                }

                setLoading(true);
                const response = await teacherService.getAllTeachers(
                    currentPage,
                    pageSize,
                    debouncedSearch,
                    selectedCategory,
                    gender,
                    priceRange[0] > 0 ? priceRange[0] : undefined,
                    priceRange[1] < 1000 ? priceRange[1] : undefined,
                    isOnline,
                    sortBy,
                    minRating,
                    showFavoritesOnly
                );
                setTeachers(response.data);
                setTotalPages(response.totalPages);
                setTotalCount(response.totalCount);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch teachers:', err);
                setError('فشل في تحميل قائمة المعلمين. يرجى المحاولة مرة أخرى.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
        localStorage.setItem('visited_teachers_page', 'true');
    }, [currentPage, pageSize, debouncedSearch, selectedCategory, gender, priceRange, isOnline, minRating, sortBy, showFavoritesOnly, refreshKey]);

    // Define standard categories to map dynamic API data or fallback
    const staticCategories = ['الكل', 'تحفيظ القرآن الكريم', 'مراجعة المحفوظ', 'تعليم التجويد النظري', 'تطبيق التجويد العملي', 'تفسير القرآن', 'القراءات العشر', 'تعليم الكبار', 'تعليم الأطفال'];
    // In the future, this can be hydrated dynamically from backend if needed.
    const categories = staticCategories;

    // Generate pagination controls
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        // Determine the range of pages to show (e.g., current - 1, current, current + 1)
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, currentPage + 1);

        // Adjust if we are at the edges to always show exactly 3 if possible
        if (currentPage === 1 && totalPages >= 3) {
            endPage = 3;
        } else if (currentPage === totalPages && totalPages >= 3) {
            startPage = totalPages - 2;
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`min-w-[40px] h-10 px-3 py-2 mx-1 rounded-md text-sm font-semibold transition-colors ${currentPage === i
                        ? 'bg-primary-600 text-white border border-primary-600'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="flex justify-center items-center mt-12 space-x-2 space-x-reverse" dir="rtl">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 mx-1 rounded-md text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                    السابق
                </button>

                {startPage > 1 && (
                    <>
                        <button onClick={() => setCurrentPage(1)} className="min-w-[40px] h-10 px-3 py-2 mx-1 rounded-md text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">1</button>
                        {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
                    </>
                )}

                {pages}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
                        <button onClick={() => setCurrentPage(totalPages)} className="min-w-[40px] h-10 px-3 py-2 mx-1 rounded-md text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">{totalPages}</button>
                    </>
                )}

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 mx-1 rounded-md text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                    التالي
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <GuestBanner />

            {/* Header / Search Section */}
            <div className="bg-white dark:bg-gray-800 shadow-sm py-8 transition-colors duration-300">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            نخبة من <span className="text-gold-500">أهل القران والعلم</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            اختر المعلم المناسب لك وابدأ رحلتك في حفظ كتاب الله وتعلم العلوم الشرعية.
                        </p>

                        {/* Search Bar */}
                        <div className="relative flex items-center">
                            <input
                                id="search-input"
                                type="text"
                                placeholder="ابحث باسم المعلم أو المادة (مثال: تجويد، فقه)..."
                                className="w-full py-4 pr-12 pl-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                data-tour="teachers-search"
                            />
                            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute right-4" />
                        </div>

                        {/* Functional Filter Tags */}
                        <div className="mt-4 flex flex-wrap justify-center gap-2" data-tour="teachers-filter-category">
                            {categories.map((tag, idx) => (
                                <button
                                    key={idx}
                                    id={`filter-${tag}`}
                                    onClick={() => setSelectedCategory(tag)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === tag
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:text-primary-600'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout with Sidebar */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filter Sidebar Toggle (Mobile) */}
                    <div className="lg:hidden flex justify-between items-center mb-4">
                        <span className="font-bold text-gray-900 dark:text-white">النتائج ({totalCount})</span>
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium"
                        >
                            <FunnelIcon className="h-5 w-5" />
                            فلاتر متقدمة
                        </button>
                    </div>

                    {/* Advanced Filters Sidebar */}
                    <aside className={`w-full lg:w-1/4 ${showMobileFilters ? 'block' : 'hidden lg:block'} space-y-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-24 transition-colors`}>
                        <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FunnelIcon className="h-5 w-5 text-primary-600" />
                                الفلترة وتخصيص البحث
                            </h2>
                            <button
                                onClick={() => {
                                    setGender('الكل');
                                    setIsOnline(false);
                                    setPriceRange([0, 1000]);
                                    setSelectedCategory('الكل');
                                    setMinRating(0);
                                    setShowFavoritesOnly(false);
                                }}
                                className="text-xs text-primary-600 hover:underline font-medium"
                            >
                                تفريغ
                            </button>
                        </div>

                        {/* Favorites Filter */}
                        <div className="pt-2">
                            <label className="flex items-center justify-between cursor-pointer group bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                                <span className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <HeartIcon className="h-5 w-5" />
                                    المعلمين المفضلين
                                </span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={showFavoritesOnly}
                                        onChange={(e) => {
                                            if (!isAuthenticated && e.target.checked) {
                                                toast.error('يجب تسجيل الدخول لعرض قائمة المفضلين');
                                                return;
                                            }
                                            setShowFavoritesOnly(e.target.checked);
                                        }}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ease-in-out ${showFavoritesOnly ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out transform ${showFavoritesOnly ? 'translate-x-[18px]' : ''}`}></div>
                                </div>
                            </label>
                        </div>

                        {/* Gender Filter */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">نوع المعلم</h3>
                            <div className="space-y-2">
                                {['الكل', 'Male', 'Female'].map(g => (
                                    <label key={g} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            checked={gender === g}
                                            onChange={() => setGender(g)}
                                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {g === 'الكل' ? 'أي نوع' : g === 'Male' ? 'معلمين (رجال)' : 'معلمات (إناث)'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Online Status */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">التواجد </h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isOnline}
                                    onChange={(e) => setIsOnline(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                    متواجد الآن
                                </span>
                            </label>
                        </div>

                        {/* Rating Filter */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">التقييم</h3>
                            <div className="space-y-2">
                                {[
                                    { value: 0, label: 'الكل' },
                                    { value: 5, label: '5 نجوم' },
                                    { value: 4, label: '4 نجوم وأكثر' },
                                    { value: 3, label: '3 نجوم وأكثر' },
                                ].map((ratingOption) => (
                                    <label key={ratingOption.value} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="minRating"
                                            checked={minRating === ratingOption.value}
                                            onChange={() => setMinRating(ratingOption.value)}
                                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                            {ratingOption.label}
                                            {ratingOption.value > 0 && (
                                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">سعر الحصة (جنيه)</h3>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">من</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        className="w-full text-center px-2 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">إلى</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-full text-center px-2 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <div className="w-full lg:w-3/4">
                        {/* Header Details (Sort + Results Count) */}
                        <div className="hidden lg:flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                وجدنا <span className="text-primary-600 font-bold">{totalCount}</span> معلماً مميزاً يناسب طلبك
                            </span>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500 font-medium whitespace-nowrap">الترتيب حسب:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="border-none bg-gray-50 dark:bg-gray-900 text-sm rounded-lg focus:ring-0 py-2 pl-8 pr-3 font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    <option value="rating">الأعلى تقييماً</option>
                                    <option value="price_asc">الأقل سعراً</option>
                                    <option value="price_desc">الأعلى سعراً</option>
                                    <option value="requests">الأكثر خبرة وطلباً</option>
                                </select>
                            </div>
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" data-tour="teachers-results-skeleton">
                                {[...Array(8)].map((_, index) => (
                                    <div key={index} className="contents">
                                        <TeacherCardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <div className="bg-red-100 dark:bg-red-900/20 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{error}</h3>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    إعادة المحاولة
                                </button>
                            </div>
                        ) : teachers.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" data-tour="teachers-results">
                                    {teachers.map(teacher => (
                                        <div key={teacher.id} className="contents">
                                            <TeacherCard
                                                teacher={teacher}
                                                isFavorite={favoriteIds.includes(teacher.id)}
                                                onToggleFavorite={handleToggleFavorite}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination UI */}
                                {renderPagination()}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                                    <FunnelIcon className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">لا توجد نتائج مطابقة</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">جرب البحث بكلمات مختلفة أو قم بإزالة بعض الفلاتر.</p>

                                {(searchTerm || selectedCategory !== 'الكل') && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('الكل');
                                        }}
                                        className="mt-6 px-6 py-2 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-semibold rounded-lg hover:bg-primary-100 transition-colors"
                                    >
                                        عرض جميع المعلمين
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Teachers;
