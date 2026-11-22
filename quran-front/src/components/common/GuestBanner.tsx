import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlusIcon, ArrowRightOnRectangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const GuestBanner: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading || isAuthenticated) return null;

    return (
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white overflow-hidden relative shadow-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center md:text-right">
                        <div className="bg-white/20 p-2 rounded-lg hidden sm:block">
                            <SparklesIcon className="h-5 w-5 text-gold-300" />
                        </div>
                        <div>
                            <p className="font-bold text-sm sm:text-base">Invest in your future today!</p>
                            <p className="text-white/80 text-xs sm:text-sm">Sign up as a student now and start your first session with our top teachers.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link
                            to="/register/student"
                            className="bg-white text-primary-900 px-5 py-2 rounded-full text-sm font-extrabold shadow-md hover:bg-gray-100 transition-all flex items-center gap-2 whitespace-nowrap border border-primary-100"
                        >
                            <UserPlusIcon className="h-4 w-4" />
                            Create Student Account
                        </Link>
                        <Link
                            to="/login"
                            className="bg-primary-800/40 text-white border border-white/30 px-5 py-2 rounded-full text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestBanner;
