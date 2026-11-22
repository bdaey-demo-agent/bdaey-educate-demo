import React, { useState } from 'react';
import { branding } from '../../branding';
import Seo from '../../components/common/Seo';
import {
    UserIcon,
    AcademicCapIcon,
    MagnifyingGlassIcon,
    CalendarIcon,
    VideoCameraIcon,
    CreditCardIcon,
    CheckBadgeIcon,
    DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const HowItWorks: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');

    return (
        <>
            <Seo
                title={`How ${branding.nameEn} Works`}
                description={`How ${branding.nameEn} works: find a teacher, choose a package, book sessions, and start your Quran learning journey.`}
                canonical="https://bdaey.com/how-it-works"
            />
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white transition-colors duration-300 font-body" dir="ltr">

            {/* Header / Hero */}
            <div className="bg-primary-green dark:bg-slate-900 text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold font-heading mb-4 text-white">How Does <span className="text-gold">{branding.nameEn}</span> Work?</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90">Your complete guide to an easy learning journey, whether you are a student seeking knowledge or a teacher spreading it.</p>
                </div>
            </div>

            {/* Toggle Switch */}
            <div className="container mx-auto px-4 -mt-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg max-w-lg mx-auto p-2 flex">
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'student'
                            ? 'bg-primary-green text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400'
                            }`}
                    >
                        <UserIcon className="w-6 h-6" />
                        As a Student
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'teacher'
                            ? 'bg-primary-green text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400'
                            }`}
                    >
                        <AcademicCapIcon className="w-6 h-6" />
                        As a Teacher
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">

                {activeTab === 'student' ? (
                    <div className="space-y-12 animate-fadeIn">
                        {/* Step 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 text-primary-green flex items-center justify-center text-3xl font-bold shrink-0">1</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Sign Up in Seconds</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Create a free student account. We only need your name and email to start your journey.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <UserIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-3xl font-bold shrink-0">2</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Find Your Ideal Teacher</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Use filters to search by subject (Tajweed, memorization, Qiraat), price, or rating. View teacher profiles and learn about their experience.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <MagnifyingGlassIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple flex items-center justify-center text-3xl font-bold shrink-0">3</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Book and Schedule Your Sessions</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Choose a package that suits you and book available slots in the teacher's schedule. The system sends you reminders before each session.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CalendarIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 flex items-center justify-center text-3xl font-bold shrink-0">4</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Start Learning Live</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    When it is time, enter the virtual classroom with one click. Connect by audio and video in high quality and start reciting.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <VideoCameraIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link to="/register/student" className="btn-gold px-12 py-4 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                Sign Up Now as a Student
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 animate-fadeIn">
                        {/* Teacher Step 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-gold/20 text-gold-600 dark:text-gold-400 flex items-center justify-center text-3xl font-bold shrink-0">1</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Submit Your Application</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Create a teacher account and complete your profile. Upload your certificates (Ijazahs, qualifications).
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <DocumentCheckIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Teacher Step 2 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center text-3xl font-bold shrink-0">2</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Review and Approval</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Our quality team reviews your information to verify your eligibility. Once approved, your account is activated and visible to students.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CheckBadgeIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Teacher Step 3 */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-3xl font-bold shrink-0">3</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Set Your Schedule and Packages</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    You are your own manager. Set your available times, session prices, and the packages you offer.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CalendarIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        {/* Teacher Step 4 */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple flex items-center justify-center text-3xl font-bold shrink-0">4</div>
                            <div className="flex-1 text-center md:text-right">
                                <h3 className="text-2xl font-bold mb-3">Receive Students and Earnings</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                    Start receiving bookings. Teach with excellence and receive your earnings regularly through your digital wallet.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <CreditCardIcon className="w-32 h-32 text-gray-200 dark:text-slate-700" />
                            </div>
                        </div>

                        <div className="text-center mt-12">
                            <Link to="/register/teacher" className="btn-gold px-12 py-4 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                                Join as a Teacher Now
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default HowItWorks;
