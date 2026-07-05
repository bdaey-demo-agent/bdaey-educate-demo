import React, { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo';

const GoogleSSOCallback: React.FC = () => {
    // Get target origin from URL query params
    const queryParams = new URLSearchParams(window.location.search);
    const targetOrigin = queryParams.get('origin');

    useEffect(() => {
        if (!targetOrigin) {
            toast.error('لم يتم تحديد النطاق المستهدف.');
        }
    }, [targetOrigin]);

    const handleSuccess = (credentialResponse: any) => {
        if (credentialResponse.credential && targetOrigin) {
            // Send the Google ID Token back to the opener window
            window.opener.postMessage(
                {
                    type: 'GOOGLE_ID_TOKEN',
                    idToken: credentialResponse.credential
                },
                targetOrigin
            );
            // Close the popup window
            window.close();
        }
    };

    const handleError = () => {
        if (targetOrigin) {
            window.opener.postMessage(
                {
                    type: 'GOOGLE_ID_TOKEN_ERROR',
                    message: 'فشل تسجيل الدخول بواسطة جوجل'
                },
                targetOrigin
            );
        }
        toast.error('فشل تسجيل الدخول بواسطة جوجل');
        setTimeout(() => {
            window.close();
        }, 1500);
    };

    return (
        <>
            <Seo title="تسجيل الدخول عبر Google" description="صفحة تسجيل الدخول الآمن عبر Google لمنصة بدائي." noIndex />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6" dir="rtl">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                {/* Logo or Premium Icon */}
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">اتصال آمن بـ Google</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                    يرجى الضغط على الزر أدناه لإتمام تسجيل الدخول بأمان عبر حساب جوجل الخاص بك.
                </p>

                <div className="flex justify-center w-full google-btn-container">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        useOneTap
                        theme="outline"
                        shape="pill"
                        size="large"
                        width="100%"
                        text="signin_with"
                    />
                </div>

                <style>{`
                    .google-btn-container iframe {
                        width: 100% !important;
                        margin: 0 auto !important;
                    }
                    .google-btn-container > div {
                        width: 100% !important;
                    }
                `}</style>

                <p className="text-xs text-gray-400 mt-8">
                    سيتم إغلاق هذه النافذة تلقائياً بعد نجاح تسجيل الدخول.
                </p>
            </div>
        </div>
        </>
    );
};

export default GoogleSSOCallback;
