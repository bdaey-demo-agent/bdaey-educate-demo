import React, { useState, useEffect } from 'react';
import { branding } from '../branding';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { handleAuthError } from '../utils/authUtils';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
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
        setErrorCode('');
        setResendSuccess('');
        try {
            const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
                email,
                password
            });
            const { token, fullName, email: userEmail, role, id, emailConfirmed, refreshToken } = response.data;
            login(token, { id, email: userEmail, fullName, role, emailConfirmed }, refreshToken);

            if (role === 'Student') navigate('/student/home');
            else if (role === 'Teacher') navigate('/teacher/home');
            else if (role === 'Admin') navigate('/admin/dashboard');
            else navigate('/');
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
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10">
            <div className="container max-w-md w-full">
                <div className="card shadow-lg border-0 bg-white p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-heading text-primary-green mb-2">تسجيل الدخول</h2>
                        <p className="text-gray-500">أهلاً بك مجدداً في {branding.nameAr}</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex flex-col gap-3">
                            <p>{error}</p>
                            {errorCode === 'EmailNotVerified' && (
                                <button 
                                    onClick={handleResendEmail}
                                    disabled={isResending || resendCooldown > 0}
                                    className={`font-bold hover:underline text-right w-full ${resendCooldown > 0 || isResending ? 'text-gray-400 cursor-not-allowed' : 'text-primary-green'}`}
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
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                            {resendSuccess}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="mb-4">
                            <label className="input-label" htmlFor="email">البريد الإلكتروني</label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="input-label" htmlFor="password">كلمة المرور</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field pr-10"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            <div className="mt-2 text-right">
                                <Link to="/forgot-password" className="text-sm font-bold text-primary-green hover:underline">هل نسيت كلمة المرور؟</Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full text-lg justify-center py-3"
                        >
                            دخول
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">أو</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <GoogleAuthButton role="General" />
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-600">
                            ليس لديك حساب؟{' '}
                            <Link to="/register/student" className="font-bold text-primary-green hover:underline">
                                أنشئ حساباً جديداً
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
