import React, { useState } from 'react';
import {
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

export interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    linkTo?: string;
    linkText?: string;
    isCompleted: boolean;
}

interface OnboardingGuideProps {
    title: string;
    subtitle: string;
    steps: OnboardingStep[];
    role?: 'Student' | 'Teacher';
    onClose?: () => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
    title,
    subtitle,
    steps,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    const completedCount = steps.filter(s => s.isCompleted).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    if (!isVisible) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 relative overflow-hidden animate-fade-in-up">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-primary-green opacity-50"></div>

            <button
                onClick={handleDismiss}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {subtitle}
                </p>

                {/* Progress Bar */}
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-green transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-bold text-primary-green">{progress}% complete</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {steps.map((step) => {
                    const isDone = step.isCompleted;
                    return (
                        <div
                            key={step.id}
                            className={`
                                relative p-4 rounded-xl border transition-all duration-300
                                ${isDone
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg ${isDone ? 'bg-green-100 text-green-600' : 'bg-gold-50 text-gold-600'}`}>
                                    <step.icon className="h-6 w-6" />
                                </div>
                                {isDone && (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500 animate-scale-in" />
                                )}
                            </div>

                            <h3 className={`font-bold mb-1 ${isDone ? 'text-green-800 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {step.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                                {step.description}
                            </p>

                            {!isDone && step.linkTo && (
                                <Link
                                    to={step.linkTo}
                                    className="text-xs font-bold text-gold-600 hover:text-gold-700 dark:text-gold-400 inline-flex items-center gap-1 group"
                                >
                                    {step.linkText || 'Get Started'}
                                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OnboardingGuide;
