import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
// import { Bars3Icon } from '@heroicons/react/24/outline'; // Hamburger menu if needed

import { useAuth } from '../context/AuthContext';


const PublicLayout: React.FC = () => {
    const { user } = useAuth();
    // const { isAuthenticated, user } = useAuth(); // Unused for now
    // const [isMenuOpen, setIsMenuOpen] = React.useState(false); // Unused

    // const getHomeLink = () => { ... } // Unused

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 flex flex-col font-body" dir="rtl">
            {/* Public Header */}
            {/* Public Header */}
            <Header />

            {/* Main Content (Add padding top for fixed header) */}
            <main className="flex-grow pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12 border-t dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4">بدائي</h3>
                        <p className="text-sm leading-relaxed">
                            منصة تعليمية رائدة لربط طلاب القرآن الكريم بأمهر المعلمين المجازين حول العالم.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">روابط سريعة</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/about-us" className="hover:text-white">من نحن</Link></li>
                            <li><Link to="/teachers-public" className="hover:text-white">تصفح المعلمين</Link></li>
                            <li><Link to="/how-to-use" className="hover:text-white">كيفية استخدام المنصة</Link></li>
                            {!user && (
                                <li><Link to="/register/teacher" className="hover:text-white">انضم كمعلم</Link></li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">الدعم</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/contact" className="hover:text-white">تواصل معنا</Link></li>
                            <li><Link to="/privacy" className="hover:text-white">سياسة الخصوصية</Link></li>
                            <li><Link to="/terms" className="hover:text-white">شروط الاستخدام</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">سياسة الأموال</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/teacher-financial-policy" className="hover:text-white">سياسة الأموال (للمعلمين)</Link></li>
                            <li><Link to="/student-refund-policy" className="hover:text-white">سياسة استرجاع الأموال (للطلاب)</Link></li>
                        </ul>
                    </div>

                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm">
                    © {new Date().getFullYear()} منصة بدائي. جميع الحقوق محفوظة.
                </div>
            </footer>

        </div>
    );
};

export default PublicLayout;
