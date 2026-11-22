import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const data = await authService.forgotPassword(email);
            setMessage(data || 'If an account exists with this email, a reset link has been sent.');
        } catch (err: any) {
            setError(err.response?.data || 'Failed to send request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10">
            <div className="container max-w-md w-full">
                <div className="card shadow-lg border-0 bg-white p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-heading text-primary-green mb-2">Reset Password</h2>
                        <p className="text-gray-500">Enter your email to receive a reset link</p>
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
                        <div className="mb-6">
                            <label className="input-label" htmlFor="email">Email</label>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full text-lg justify-center py-3 disabled:opacity-70"
                        >
                            {loading ? 'Sending...' : 'Send Link'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-600">
                            Remembered your password?{' '}
                            <Link to="/login" className="font-bold text-primary-green hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
