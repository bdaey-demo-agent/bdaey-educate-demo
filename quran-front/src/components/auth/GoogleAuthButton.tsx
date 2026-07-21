import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface GoogleAuthButtonProps {
    role?: string;
}

type PromptState = 'none' | 'confirm_student' | 'confirm_teacher' | 'general_choice';

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ role = 'General' }) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [promptState, setPromptState] = useState<PromptState>('none');
    const [tempIdToken, setTempIdToken] = useState<string>('');

    const isMainDomain = true;
    const MAIN_QURAN_DOMAIN = typeof window !== 'undefined' ? window.location.origin : '';

    const handleGoogleAuth = async (idToken: string, createIfNotExists: boolean, targetedRole?: string) => {
        const activeRole = targetedRole || role;
        const loadingToast = !createIfNotExists ? toast.loading('جاري التحقق...') : toast.loading('جاري إنشاء الحساب...');
        try {
            const response = await axios.post(`${API_BASE_URL}/Auth/google`, {
                idToken,
                role: activeRole === 'General' ? 'Student' : activeRole,
                createIfNotExists
            });

            const { token, fullName, email: userEmail, role: userRole, id, emailConfirmed } = response.data;
            login(token, { id, email: userEmail, fullName, role: userRole, emailConfirmed });

            toast.dismiss(loadingToast);
            toast.success('تم تسجيل الدخول بنجاح');
            setPromptState('none');

            if (userRole === 'Student') navigate('/student/dashboard');
            else if (userRole === 'Teacher') navigate('/teacher/dashboard');
            else navigate('/');

        } catch (err: any) {
            toast.dismiss(loadingToast);
            if (err.response?.status === 404 && err.response?.data?.code === 'AccountNotFound') {
                setTempIdToken(idToken);
                if (role === 'Student') setPromptState('confirm_student');
                else if (role === 'Teacher') setPromptState('confirm_teacher');
                else setPromptState('general_choice');
            } else {
                const errorMsg = err.response?.data?.message || err.response?.data || 'حدث خطأ أثناء تسجيل الدخول بواسطة جوجل';
                toast.error(typeof errorMsg === 'string' ? errorMsg : 'حدث خطأ أثناء تسجيل الدخول بواسطة جوجل');
                console.error(err);
            }
        }
    };

    const handleCustomGoogleClick = () => {
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
            `${MAIN_QURAN_DOMAIN}/google-sso-callback?origin=${encodeURIComponent(window.location.origin)}`,
            'GoogleSSO',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
            toast.error('يرجى السماح بفتح النوافذ المنبثقة (Popups) لتسجيل الدخول بجوجل.');
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            const expectedOrigin = MAIN_QURAN_DOMAIN;
            if (event.origin !== expectedOrigin) return;

            if (event.data?.type === 'GOOGLE_ID_TOKEN') {
                const { idToken } = event.data;
                handleGoogleAuth(idToken, false);
                window.removeEventListener('message', handleMessage);
            } else if (event.data?.type === 'GOOGLE_ID_TOKEN_ERROR') {
                toast.error(event.data.message || 'فشل تسجيل الدخول بواسطة جوجل');
                window.removeEventListener('message', handleMessage);
            }
        };

        window.addEventListener('message', handleMessage);

        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', handleMessage);
            }
        }, 1000);
    };

    if (promptState !== 'none') {
        return (
            <div className="p-6 border-2 border-primary-50 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl shadow-xl text-center transform transition-all duration-300 scale-100" dir="rtl">
                <div className="mb-6">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    {promptState === 'confirm_student' && (
                        <>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">إنشاء حساب طالب الجديد</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">أنت على وشك إضافة حساب طالب. هل تود الاستمرار كطالب أم تفضل أن تكون معلماً؟</p>
                        </>
                    )}
                    {promptState === 'confirm_teacher' && (
                        <>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">إنشاء حساب معلم جديد</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">أنت على وشك إضافة حساب معلم. هل تود الاستمرار كمعلم أم تفضل أن تكون طالباً؟</p>
                        </>
                    )}
                    {promptState === 'general_choice' && (
                        <>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">أهلاً بك في بدائي</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">هذا الحساب غير مسجل لدينا. يرجى اختيار نوع الحساب الذي تود البدء به:</p>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {promptState === 'confirm_student' && (
                        <>
                            <button onClick={() => handleGoogleAuth(tempIdToken, true, 'Student')} className="w-full py-3.5 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">استمرار كطالب</button>
                            <button onClick={() => handleGoogleAuth(tempIdToken, true, 'Teacher')} className="w-full py-3.5 border-2 border-gold-500 text-gold-600 dark:text-gold-400 rounded-2xl font-bold hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-all active:scale-[0.98]">أريد أن أكون معلماً</button>
                        </>
                    )}
                    {promptState === 'confirm_teacher' && (
                        <>
                            <button onClick={() => handleGoogleAuth(tempIdToken, true, 'Teacher')} className="w-full py-3.5 bg-gold-500 text-white rounded-2xl font-bold hover:bg-gold-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">استمرار كمعلم</button>
                            <button onClick={() => handleGoogleAuth(tempIdToken, true, 'Student')} className="w-full py-3.5 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-2xl font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-[0.98]">أريد أن أكون طالباً</button>
                        </>
                    )}
                    {promptState === 'general_choice' && (
                        <>
                            <button onClick={() => handleGoogleAuth(tempIdToken, true, 'Student')} className="w-full py-3.5 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">إنشاء حساب طالب</button>
                            <button onClick={() => handleGoogleAuth(tempIdToken, true, 'Teacher')} className="w-full py-3.5 bg-gold-500 text-white rounded-2xl font-bold hover:bg-gold-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98]">إنشاء حساب معلم</button>
                        </>
                    )}
                    <button onClick={() => setPromptState('none')} className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline underline-offset-4 decoration-dotted">إلغاء العملية</button>
                </div>
            </div>
        );
    }

    if (!isMainDomain) {
        return (
            <button
                type="button"
                onClick={handleCustomGoogleClick}
                className="w-full py-3.5 px-4 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 active:scale-[0.98] shadow-sm font-sans"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.07-1.39-1.38-2.22z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>تسجيل الدخول بواسطة Google</span>
            </button>
        );
    }

    return (
        <div className="flex justify-center w-full google-btn-container">
            <GoogleLogin
                onSuccess={credentialResponse => {
                    if (credentialResponse.credential) {
                        handleGoogleAuth(credentialResponse.credential, false);
                    }
                }}
                onError={() => {
                    toast.error('فشل تسجيل الدخول بواسطة جوجل');
                }}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                width="400"
                text="signin_with"
            />
            <style>{`
                .google-btn-container iframe {
                    width: 100% !important;
                    margin: 0 auto !important;
                }
                .google-btn-container > div {
                    width: 100% !important;
                }
            `}</style>
        </div>
    );
};

export default GoogleAuthButton;

