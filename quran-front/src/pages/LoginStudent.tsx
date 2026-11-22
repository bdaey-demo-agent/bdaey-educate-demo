import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { handleAuthError } from '../utils/authUtils';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginStudent: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
                email,
                password
            });
            const { token, fullName, email: userEmail, role, id, emailConfirmed } = response.data; // Ensure backend returns role or decode it

            // Optional: Strict Role Check
            // ... (comments)

            login(token, { id, email: userEmail, fullName, role, emailConfirmed }); // Update auth context

            // Force redirect to Student Dashboard
            navigate('/student/dashboard');

        } catch (err: any) {
            handleAuthError(err, navigate, setError);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-primary-500/10 dark:border-gray-700">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-primary-600 dark:text-white font-heading mb-2">Student Sign In</h2>
                    <p className="text-gray-600 dark:text-gray-400">Welcome to your learning journey</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 rounded-md">
                        <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
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
                                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">Forgot your password?</Link>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                        Sign In
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                    </div>
                </div>

                <GoogleAuthButton role="Student" />

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="text-center space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have a student account?{' '}
                            <Link to="/register/student" className="font-bold text-primary-600 hover:text-primary-700 hover:underline">Create a new account</Link>
                        </p>
                        <p>
                            <Link to="/teacher/login" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Are you a teacher? Teacher sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginStudent;
