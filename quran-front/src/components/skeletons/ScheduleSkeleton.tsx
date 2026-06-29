import React from 'react';
import Skeleton from '../common/Skeleton';

const ScheduleSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 w-full">
                            {/* Date Box */}
                            <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />

                            {/* Info */}
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-3/4 max-w-[200px]" />
                                <Skeleton className="h-4 w-1/2 max-w-[150px]" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduleSkeleton;
