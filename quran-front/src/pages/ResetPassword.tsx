import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Get email and token from URL query params
    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword.length < 6) {
            setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('كلمات المرور غير متطابقة.');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword({ email, token, newPassword });
            setMessage('تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data || 'Failed to reset password. Token may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!email || !token) {
        return (
            <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10">
                <div className="card shadow-lg border-0 bg-white p-8 text-center text-red-600">
                    رابط غير صالح. يرجى التأكد من الرابط أو طلب إعادة تعيين جديدة.
                    <br />
                    <Link to="/forgot-password" className="text-primary-green underline mt-4 block">طلب رابط جديد</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10">
            <div className="container max-w-md w-full">
                <div className="card shadow-lg border-0 bg-white p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-heading text-primary-green mb-2">تعيين كلمة مرور جديدة</h2>
                        <p className="text-gray-500">للحساب: {email}</p>
                    </div>

                    {message && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="input-label" htmlFor="newPassword">كلمة المرور الجديدة</label>
                            <input
                                id="newPassword"
                                type="password"
                                className="input-field"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="input-label" htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full text-lg justify-center py-3 disabled:opacity-70"
                        >
                            {loading ? 'جاري التحديث...' : 'حفظ كلمة المرور'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
