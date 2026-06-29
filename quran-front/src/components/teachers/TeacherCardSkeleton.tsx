import React from 'react';

const TeacherCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full animate-pulse">
            {/* Image Placeholder */}
            <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
                <div className="absolute top-2 right-2 bg-gray-300 dark:bg-gray-600 w-12 h-6 rounded-md"></div>
            </div>

            {/* Content Section Placeholder */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Title & Name Placeholder */}
                <div className="mb-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>

                {/* Subjects Badges Placeholder */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>

                {/* Bio Placeholder */}
                <div className="space-y-2 mb-4 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>

                {/* Pricing & Action Placeholder */}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    </div>

                    <div className="h-9 w-24 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default TeacherCardSkeleton;
