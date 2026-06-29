import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface DraggableSectionProps {
    id: string;
    index: number;
    title?: string;
    onMove: (index: number, direction: 'up' | 'down') => void;
    isEditing: boolean;
    children: React.ReactNode;
    className?: string;
    hideBorder?: boolean;
}

const DraggableSection: React.FC<DraggableSectionProps> = ({
    index,
    // title, // Removed unused prop
    onMove,
    isEditing,
    children,
    className = "",
    hideBorder = false
}) => {
    return (
        <div className={`relative transition-all duration-300 ${isEditing ? 'pl-12 pr-4 py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 mb-6' : (hideBorder ? '' : 'mb-8')} ${className}`}>

            {isEditing && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-white dark:bg-gray-700 rounded-full shadow-md p-1 z-10">
                    <button
                        onClick={() => onMove(index, 'up')}
                        className="p-1 hover:bg-gold-50 dark:hover:bg-gold-900/30 text-gray-500 hover:text-gold-600 rounded-full transition-colors"
                        title="تحريك للأعلى"
                    >
                        <ChevronUpIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onMove(index, 'down')}
                        className="p-1 hover:bg-gold-50 dark:hover:bg-gold-900/30 text-gray-500 hover:text-gold-600 rounded-full transition-colors"
                        title="تحريك للأسفل"
                    >
                        <ChevronDownIcon className="h-5 w-5" />
                    </button>
                    <div className="text-xs text-center font-bold text-gray-400 select-none">
                        {index + 1}
                    </div>
                </div>
            )}

            {children}
        </div>
    );
};

export default DraggableSection;
