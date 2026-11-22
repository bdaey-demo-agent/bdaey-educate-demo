import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../config';

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const verify = async () => {
            const userId = searchParams.get('userId');
            const token = searchParams.get('token');

            if (!userId || !token) {
                setStatus('error');
                setMessage('Invalid link');
                return;
            }

            try {
                // Using axios directly or use authService if preferred
                const response = await axios.get(`${API_BASE_URL}/auth/confirm-email`, {
                    params: { userId, token }
                });

                setStatus('success');

                // Sync the token in the browser if the user is already logged in
                const updatedUser = localStorage.getItem('user');
                if (updatedUser && response.data && response.data.token) {
                    setIsLoggedIn(true);
                    localStorage.setItem('user', JSON.stringify({
                        id: response.data.id,
                        email: response.data.email,
                        fullName: response.data.fullName,
                        role: response.data.role,
                        userName: response.data.userName,
                        emailConfirmed: response.data.emailConfirmed
                    }));
                    localStorage.setItem('token', response.data.token);
                    if (response.data.refreshToken) {
                        localStorage.setItem('refreshToken', response.data.refreshToken);
                    }

                    // Also trigger context login
                    login(response.data.token, response.data, response.data.refreshToken);
                }

            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setMessage(err.response?.data || 'Email verification failed. The link may have expired.');
            }
        };

        verify();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg text-center animate-fadeIn">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="h-12 w-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Verifying...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Account Activated!</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Your email has been verified. {isLoggedIn ? 'You can return to your profile and keep browsing.' : 'You can now sign in.'}
                        </p>
                        {isLoggedIn ? (
                            <Link
                                to="/student/profile"
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-md transition-all w-full"
                            >
                                Back to Profile
                            </Link>
                        ) : (
                            <Link
                                to="/teacher/login"
                                className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-6 rounded-md transition-all w-full"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Verification Failed</h2>
                        <p className="text-red-500 mb-6">
                            {message}
                        </p>
                        <Link
                            to="/"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            Back to Home
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VerifyEmail;
