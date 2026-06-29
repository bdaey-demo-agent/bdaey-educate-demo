import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon, PencilSquareIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
    const { user, login, resendVerification } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

    // General State
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState(user?.email || '');

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);

    // Fetch latest profile data
    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                setFullName(data.fullName);
                setPhoneNumber(data.phoneNumber || '');
                setEmail(data.email || user?.email || '');
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchProfile();
    }, []);

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.updateProfile({ fullName, phoneNumber, email });
            toast.success('تم تحديث الملف الشخصي');

            // Reload user data fully to sync new token and claims correctly
            const updatedUser = localStorage.getItem('user');
            const updatedToken = localStorage.getItem('token');

            if (updatedUser && updatedToken) {
                login(updatedToken, JSON.parse(updatedUser));

                if (user?.email !== email) {
                    toast.success('تم تغيير بريدك الإلكتروني بنجاح. يرجى تفعيل البريد الجديد الآن.', { duration: 5000 });
                }
            }

            setIsEditingName(false);
            setIsEditingPhone(false);
            setIsEditingEmail(false);
        } catch (error: any) {
            toast.error(error?.response?.data || 'فشل التحديث');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('كلمة المرور غير متطابقة');
            return;
        }
        try {
            await authService.changePassword({ currentPassword, newPassword });
            toast.success('تم تغيير كلمة المرور');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error('فشل تغيير كلمة المرور');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-0 md:p-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 md:rounded-xl shadow-none md:shadow overflow-hidden min-h-screen md:min-h-0">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 md:py-4 text-center font-medium text-sm md:text-base ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UserCircleIcon className="h-5 w-5" />
                            البيانات الشخصية
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-3 md:py-4 text-center font-medium text-sm md:text-base ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <KeyIcon className="h-5 w-5" />
                            الأمان
                        </div>
                    </button>
                </div>

                <div className="p-4 md:p-8">
                    {activeTab === 'general' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg mx-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
                                <div className="flex gap-2 items-center w-full">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`flex-1 min-w-0 px-4 py-2 border rounded-lg transition-colors ${isEditingEmail
                                            ? 'dark:bg-gray-700 dark:border-blue-500 border-blue-500'
                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        disabled={!isEditingEmail}
                                        required
                                    />

                                    {!isEditingEmail && user?.emailConfirmed && (
                                        <div className="flex items-center gap-1 text-green-600 font-medium px-2 shrink-0">
                                            <CheckCircleIcon className="h-5 w-5" />
                                            <span className="text-sm">مؤكد</span>
                                        </div>
                                    )}

                                    {!isEditingEmail && !user?.emailConfirmed && (
                                        <button
                                            type="button"
                                            onClick={() => resendVerification()}
                                            className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/50 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0"
                                        >
                                            تأكيد التفعيل
                                        </button>
                                    )}

                                    {/* Edit Toggle Button */}
                                    {!isEditingEmail ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingEmail(true)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition shrink-0 w-10 h-10 flex items-center justify-center"
                                            title="تعديل الإيميل"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingEmail(false);
                                                setEmail(user?.email || ''); // Revert changes
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition shrink-0 w-10 h-10 flex items-center justify-center"
                                            title="إلغاء التعديل"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الاسم الكامل</label>
                                <div className="flex gap-2 items-center w-full">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className={`flex-1 min-w-0 px-4 py-2 border rounded-lg transition-colors ${isEditingName
                                            ? 'dark:bg-gray-700 dark:border-blue-500 border-blue-500'
                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        required
                                        disabled={!isEditingName}
                                    />
                                    {/* Edit Toggle Button */}
                                    {!isEditingName ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingName(true)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition shrink-0 w-10 h-10 flex items-center justify-center"
                                            title="تعديل الاسم"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingName(false)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition shrink-0 w-10 h-10 flex items-center justify-center"
                                            title="إلغاء التعديل"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                                <div className="flex gap-2 items-center w-full">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className={`flex-1 min-w-0 px-4 py-2 border rounded-lg transition-colors ${isEditingPhone
                                            ? 'dark:bg-gray-700 dark:border-blue-500 border-blue-500'
                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        placeholder="رقم الهاتف"
                                        disabled={!isEditingPhone}
                                    />
                                    {/* Edit Toggle Button */}
                                    {!isEditingPhone ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPhone(true)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition shrink-0 w-10 h-10 flex items-center justify-center"
                                            title="تعديل الرقم"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPhone(false)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition shrink-0 w-10 h-10 flex items-center justify-center"
                                            title="إلغاء التعديل"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                                onClick={() => setIsEditingPhone(false)} // Reset edit mode after saving
                            >
                                حفظ التغييرات
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg mx-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الحالية</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تأكيد كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                            >
                                تغيير كلمة المرور
                            </button>
                        </form>
                    )}
                </div>
            </div >
        </div >
    );
};

export default ProfilePage;
