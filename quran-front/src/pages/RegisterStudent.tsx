import React, { useState, useEffect } from 'react';
import { branding } from '../branding';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DateInput from '../components/common/DateInput';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { convertArabicToEnglish } from '../utils/stringUtils';

const RegisterStudent: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '' // Default empty to force selection
    });
    const [age, setAge] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Auto-calculate age
    useEffect(() => {
        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            setAge(calculatedAge);
        } else {
            setAge(null);
        }
    }, [formData.dateOfBirth]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;

        if (e.target.name === 'phoneNumber') {
            value = convertArabicToEnglish(value);
            // Only allow numbers
            if (!/^\d*$/.test(value)) return;
        }

        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) return 'يرجى إدخال الاسم الكامل';
        if (!formData.email.trim()) return 'يرجى إدخال البريد الإلكتروني';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'البريد الإلكتروني غير صحيح';
        if (!formData.phoneNumber.trim()) return 'يرجى إدخال رقم الهاتف';
        if (!/^01[0125][0-9]{8}$/.test(formData.phoneNumber)) return 'رقم الهاتف يجب أن يكون مصرياً صحيحاً (11 رقم يبدأ بـ 01)';
        if (!formData.dateOfBirth) return 'يرجى اختيار تاريخ الميلاد';
        if (!formData.gender) return 'يرجى اختيار النوع';
        if (!formData.password) return 'يرجى إدخال كلمة المرور';
        if (formData.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        if (formData.password !== formData.confirmPassword) return 'كلمات المرور غير متطابقة';
        return null;
    };

    const getErrorMessage = (err: any) => {
        if (!err.response) return 'فشل الاتصال بالخادم. يرجى التحقق من الإنترنت.';

        const data = err.response.data;

        // Handle Identity Errors (Array of objects)
        if (Array.isArray(data)) {
            const firstError = data[0];
            switch (firstError.code) {
                case 'DuplicateUserName': return 'البريد الإلكتروني مستخدم بالفعل';
                case 'DuplicateEmail': return 'البريد الإلكتروني مستخدم بالفعل';
                case 'PasswordTooShort': return 'كلمة المرور قصيرة جداً';
                case 'PasswordRequiresNonAlphanumeric': return 'كلمة المرور يجب أن تحتوي على رموز خاصة (@#$%)';
                case 'PasswordRequiresDigit': return 'كلمة المرور يجب أن تحتوي على أرقام';
                case 'PasswordRequiresUpper': return 'كلمة المرور يجب أن تحتوي على حروف كبيرة';
                default: return firstError.description || 'حدث خطأ في التسجيل';
            }
        }

        // Handle Generic Message
        if (data.message) return data.message;

        // Handle Key-Value Errors (ModelState)
        if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length > 0 && data[keys[0]].length > 0) {
                return `${keys[0]}: ${data[keys[0]][0]}`;
            }
        }

        return 'فشل إنشاء الحساب. تأكد من البيانات وحاول مرة أخرى.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        try {
            await register(
                formData.email,
                formData.password,
                formData.fullName,
                formData.phoneNumber,
                new Date(formData.dateOfBirth),
                formData.gender,
                'Student'
            );

            navigate('/student/dashboard');
        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10 transition-colors duration-300">
            <div className="container max-w-lg w-full">
                <div className="card shadow-lg border-0 bg-white dark:bg-gray-800 p-8 rounded-2xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-heading text-primary-green dark:text-white mb-2">
                            إنشاء حساب <span className="text-gold-500">طالب</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            انضم إلى منصة {branding.nameAr} وابدأ رحلتك التعليمية
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit} dir="rtl">
                        <div className="space-y-4">

                            {/* Full Name & Phone Row */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="محمد أحمد"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        required
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        placeholder="01xxxxxxxxx"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* DOB & Gender */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <DateInput
                                        label={`تاريخ الميلاد ${age !== null ? `(${age} سنة)` : ''}`}
                                        value={formData.dateOfBirth}
                                        onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النوع</label>
                                    <select
                                        name="gender"
                                        required
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">اختر النوع</option>
                                        <option value="Male">ذكر</option>
                                        <option value="Female">أنثى</option>
                                    </select>
                                </div>
                            </div>

                            {/* Passwords */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            required
                                            className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            placeholder="********"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            required
                                            className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            placeholder="********"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? 'جاري التسجيل...' : 'إنشاء حساب طالب'}
                            </button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">أو</span>
                            </div>
                        </div>

                        <GoogleAuthButton role="Student" />

                        <div className="text-sm text-center">
                            <span className="text-gray-600 dark:text-gray-400">لديك حساب بالفعل؟ </span>
                            <Link to="/student/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                                سجل دخولك الآن
                            </Link>
                        </div>

                        {/* WhatsApp Support */}
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                تواجه مشكلة في التسجيل أو لديك استفسار؟ نحن هنا للمساعدة
                            </p>
                            <a 
                                href="https://wa.me/12048009763?text=%D8%A3%D9%86%D8%A7%20%D8%B7%D8%A7%D9%84%D8%A8%20%D9%88%D8%AA%D9%88%D8%A7%D8%AC%D9%87%D9%86%D9%8A%20%D9%85%D8%B4%D9%83%D9%84%D8%A9%20%D9%81%D9%8A%20%D8%A5%D9%86%D8%B4%D8%A7%D8%A1%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-all border border-green-100 dark:border-green-800/30"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                </svg>
                                تواصل معنا عبر واتساب
                            </a>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterStudent;
