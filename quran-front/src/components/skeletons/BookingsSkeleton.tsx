import React from 'react';
import Skeleton from '../common/Skeleton';

const BookingsSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-12" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex flex-col md:flex-row items-start gap-4 flex-1">
                                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex gap-4 mt-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex md:flex-col items-end gap-2 mt-4 md:mt-0">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-8 w-20 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingsSkeleton;
