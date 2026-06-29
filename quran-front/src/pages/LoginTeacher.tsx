import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { handleAuthError } from '../utils/authUtils';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginTeacher: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorCode, setErrorCode] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (resendCooldown > 0) {
            const timerId = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timerId);
        }
    }, [resendCooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
                email,
                password
            });
            const { token, fullName, email: userEmail, role, id, emailConfirmed } = response.data;

            login(token, { id, email: userEmail, fullName, role, emailConfirmed });

            // Force redirect to Teacher Dashboard
            navigate('/teacher/dashboard');

        } catch (err: any) {
            const data = err.response?.data;
            const message = data?.message || data;
            
            if (data?.code === 'EmailNotVerified' || (typeof message === 'string' && message.includes('تفعيل بريدك'))) {
                setError(typeof message === 'string' ? `${message} (إذا لم تجد الرسالة، يرجى التحقق من قسم Spam).` : 'يرجى تفعيل بريدك الإلكتروني قبل تسجيل الدخول (تحقق أيضاً من قسم Spam).');
                setErrorCode('EmailNotVerified');
            } else {
                handleAuthError(err, navigate, setError);
            }
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) return;
        setIsResending(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/Auth/resend-verification-anonymous`, { email });
            setResendSuccess('تم إرسال رابط التحقق بنجاح. يرجى مراجعة بريدك الإلكتروني (وتفقد قسم Spam إذا لم تجدها).');
            setErrorCode('');
            setResendCooldown(60);
        } catch (err: any) {
            setError('فشل إرسال رابط التحقق. يرجى المحاولة لاحقاً.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gold-500/10 dark:border-gray-700">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gold-600 dark:text-gold-500 font-heading mb-2">تسجيل دخول المعلمين</h2>
                    <p className="text-gray-600 dark:text-gray-400">أهلاً بك يا صانع الأجيال</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 rounded-md flex flex-col gap-3">
                        <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        {errorCode === 'EmailNotVerified' && (
                            <button 
                                onClick={handleResendEmail}
                                disabled={isResending || resendCooldown > 0}
                                className={`text-sm font-bold text-right w-full hover:underline ${resendCooldown > 0 || isResending ? 'text-gray-400 cursor-not-allowed' : 'text-gold-600 dark:text-gold-400'}`}
                            >
                                {isResending 
                                    ? 'جاري الإرسال...' 
                                    : resendCooldown > 0 
                                        ? `يمكنك إعادة الإرسال بعد (${resendCooldown}) ثانية` 
                                        : 'إرسال رابط التحقق مرة أخرى'}
                            </button>
                        )}
                    </div>
                )}

                {resendSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500 p-4 rounded-md">
                        <p className="text-sm text-green-700 dark:text-green-200">{resendSuccess}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <input
                                id="email"
                                type="email"
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                                placeholder="teacher@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            <div className="mt-2 text-right">
                                <Link to="/forgot-password" className="text-sm font-medium text-gold-600 hover:text-gold-500 dark:text-gold-400">هل نسيت كلمة المرور؟</Link>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-md text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-colors"
                    >
                        دخول المعلمين
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">أو</span>
                    </div>
                </div>

                <GoogleAuthButton role="Teacher" />

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="text-center space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            ليس لديك حساب معلم؟ <Link to="/register/teacher" className="font-bold text-gold-600 hover:text-gold-500 hover:underline">انضم إلينا كمعلم</Link>
                        </p>
                        <p>
                            <Link to="/student/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">هل أنت طالب؟ تسجيل دخول الطلاب</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginTeacher;
