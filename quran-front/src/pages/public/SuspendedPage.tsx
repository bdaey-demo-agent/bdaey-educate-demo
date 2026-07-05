import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Seo from '../../components/common/Seo';

const SuspendedPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const isSuspended = localStorage.getItem('isSuspended');
        if (!isSuspended) {
            navigate('/', { replace: true });
        }
    }, [navigate]);
    return (
        <>
            <Seo title="حساب معلق" description="حسابك معلق مؤقتاً. يرجى التواصل مع الدعم الفني." noIndex />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">تم تعليق الحساب</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    عذراً، تم تعليق حسابك مؤقتاً بواسطة إدارة المنصة. يرجى التواصل مع الدعم الفني لمزيد من التفاصيل أو لفك الحظر.
                </p>
                <div className="space-y-4">
                    <Link
                        to="/contact"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        تواصل مع الإدارة
                    </Link>
                    <Link
                        to="/"
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        العودة للرئيسية
                    </Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default SuspendedPage;
