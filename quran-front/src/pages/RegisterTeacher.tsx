import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // Import toast
import { useAuth } from '../context/AuthContext';
import {
    UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon,
    ShieldCheckIcon,
    ArrowLeftIcon, EyeIcon, EyeSlashIcon,
    CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline';
import authService from '../services/authService';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';

import { convertArabicToEnglish } from '../utils/stringUtils';

const RegisterTeacher: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    // Success State to show the "Check your email" view
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        gender: '',
        agreedToTerms: false,
        agreedToPrivacy: false,
        agreedToEmail: false
    });

    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

    // Debounced Username Check
    React.useEffect(() => {
        const username = formData.username;
        if (!username) {
            setUsernameStatus('idle');
            return;
        }

        // Basic Regex Validation
        if (!/^[a-zA-Z0-9._]+$/.test(username)) {
            setUsernameStatus('invalid');
            return;
        }

        setUsernameStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const isAvailable = await authService.checkUsernameAvailability(username);
                setUsernameStatus(isAvailable ? 'available' : 'taken');
            } catch (error) {
                console.error('Check failed', error);
                setUsernameStatus('idle');
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.username]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        if (e.target.name === 'phoneNumber') {
            value = convertArabicToEnglish(value);
            // Only allow numbers for phone
            if (!/^\d*$/.test(value)) return;
        }

        setFormData({ ...formData, [e.target.name]: value });
    };

    const nextStep = () => {
        setError('');
        if (step === 1) {
            if (!formData.username || !formData.fullName || !formData.email || !formData.phoneNumber || !formData.password || !formData.confirmPassword || !formData.gender) {
                setError('Please fill in all required fields');
                return;
            }
            if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
                setError('Username may only contain Latin letters, digits, a dot or underscore.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
            // Skip OTP step, go directly to Terms (previously step 3)
            setStep(2);
        }
    };

    const prevStep = () => setStep(step - 1);

    const getErrorMessage = (err: any) => {
        if (!err.response) return 'Could not reach the server. Please check your internet connection.';

        const data = err.response.data;

        // Handle Identity Errors (Array of objects)
        if (Array.isArray(data)) {
            const firstError = data[0];
            switch (firstError.code) {
                case 'DuplicateUserName': return 'Username is already taken';
                case 'DuplicateEmail': return 'This email is already registered';
                case 'PasswordTooShort': return 'Password is too short (minimum 8 characters)';
                case 'PasswordRequiresNonAlphanumeric': return 'Password must contain a special character (@#$%)';
                case 'PasswordRequiresDigit': return 'Password must contain a digit';
                case 'PasswordRequiresUpper': return 'Password must contain an uppercase letter';
                case 'PasswordRequiresLower': return 'Password must contain a lowercase letter';
                default: return firstError.description || 'Registration error';
            }
        }

        // Handle Generic Message
        if (data.message) return data.message;

        // Handle Key-Value Errors (ModelState)
        if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length > 0 && data[keys[0]].length > 0) {
                return `${data[keys[0]][0]}`; // Return the first error message directly
            }
        }

        return 'Could not create the account. Check your details and try again.';
    };

    const handleSubmit = async () => {
        if (!formData.agreedToTerms || !formData.agreedToPrivacy || !formData.agreedToEmail) {
            setError('You must accept all terms and agree to account activation to continue');
            return;
        }

        setIsLoading(true);
        try {
            const defaultDOB = new Date();

            await register(
                formData.email,
                formData.password,
                formData.fullName,
                formData.phoneNumber,
                defaultDOB,
                formData.gender,
                'Teacher',
                formData.username
            );

            // Show Success View instead of immediate redirect
            setIsSuccess(true);
            toast.success('Account created successfully', { duration: 4000 });

        } catch (err: any) {
            console.error('Registration error detailed:', err.response?.data);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    // If Registration Successful -> Show Email Verification Instructions
    if (isSuccess) {
        return (
            <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10">
                <div className="container max-w-lg w-full">
                    <div className="card shadow-lg border-0 bg-white dark:bg-gray-800 p-8 text-center animate-fadeIn">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                            <EnvelopeIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                            Account created successfully!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            We have sent an activation link to your email: <br />
                            <span className="font-bold text-primary-green dir-ltr block mt-2">{formData.email}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                            Please check your inbox (or Spam folder) and click the link to activate your account and start using the platform.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/teacher/login')}
                                className="w-full py-3 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-gold-500 hover:bg-gold-600 transition-all"
                            >
                                Go to Sign In
                            </button>
                            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-light py-10 transition-colors duration-300">
            <div className="container max-w-lg w-full">
                <div className="card shadow-lg border-0 bg-white dark:bg-gray-800 p-8 relative overflow-hidden">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-heading text-primary-green dark:text-gold-500 mb-2">
                            Join the Elite
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">A few simple steps between you and your students</p>
                    </div>

                    {/* Progress Bar (2 Steps now) */}
                    <div className="absolute top-0 left-0 h-1 bg-gray-100 dark:bg-gray-700 w-full">
                        <div
                            className="h-full bg-gold-500 transition-all duration-500 ease-in-out"
                            style={{ width: `${(step / 2) * 100}%` }}
                        />
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-3 rounded-l-md">
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Basic Information</h3>
                                <span className="text-xs text-gray-500">Step 1 of 2</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                        <span className="text-gray-400 text-sm">@</span>
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        className={`block w-full pr-10 pl-10 sm:text-sm rounded-md py-3 font-mono text-left
                                            ${usernameStatus === 'invalid' || usernameStatus === 'taken'
                                                ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                                                : usernameStatus === 'available'
                                                    ? 'border-green-300 text-green-900 placeholder-green-300 focus:outline-none focus:ring-green-500 focus:border-green-500'
                                                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-gold-500 focus:border-gold-500'
                                            }
                                        `}
                                        placeholder="username"
                                        dir="ltr"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                    {/* Status Indicator */}
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {usernameStatus === 'checking' && (
                                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {usernameStatus === 'available' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                                        {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircleIcon className="h-5 w-5 text-red-500" />}
                                    </div>
                                </div>
                                {usernameStatus === 'taken' && <p className="mt-1 text-sm text-red-600">Username not available</p>}
                                {usernameStatus === 'available' && <p className="mt-1 text-sm text-green-600">Username available</p>}
                                {usernameStatus === 'invalid' && formData.username.length > 0 && <p className="mt-1 text-sm text-red-600">Latin letters, digits, . and _ only</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fullName"
                                        className="focus:ring-gold-500 focus:border-gold-500 block w-full pr-10 pl-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-3"
                                        placeholder="At least your full name"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={(e: any) => handleChange(e)}
                                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-gold-500 focus:border-gold-500 sm:text-sm"
                                >
                                    <option value="" disabled>Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        className="focus:ring-gold-500 focus:border-gold-500 block w-full pr-10 pl-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-3"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        className="focus:ring-gold-500 focus:border-gold-500 block w-full pr-10 pl-3 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-3 text-right"
                                        placeholder="01xxxxxxxxx"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            className="focus:ring-gold-500 focus:border-gold-500 block w-full pr-10 pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-3"
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            className="focus:ring-gold-500 focus:border-gold-500 block w-full px-3 pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-3"
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

                            <button
                                onClick={nextStep}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all transform hover:scale-[1.02]"
                            >
                                Continue <ArrowLeftIcon className="mr-2 h-4 w-4" />
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                                </div>
                            </div>

                            <GoogleAuthButton role="Teacher" />
                        </div>
                    )}

                    {/* Step 2: Terms & Submit (Formerly Step 3) */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="text-center mb-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Final Agreements</h3>
                                <p className="text-sm text-gray-500">To complete registration, please accept the terms</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3 border border-gray-100 dark:border-gray-700">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                                        checked={formData.agreedToTerms}
                                        onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-gold-600 font-bold underline hover:text-gold-500">Terms of Use</Link>.
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                                        checked={formData.agreedToPrivacy}
                                        onChange={(e) => setFormData({ ...formData, agreedToPrivacy: e.target.checked })}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        I agree to the <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-600 font-bold underline hover:text-gold-500">Privacy Policy</Link>.
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                                        checked={formData.agreedToEmail}
                                        onChange={(e) => setFormData({ ...formData, agreedToEmail: e.target.checked })}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-bold">I confirm the information entered is accurate and agree to activate my account via email.</span>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={prevStep}
                                    className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !formData.agreedToTerms || !formData.agreedToPrivacy || !formData.agreedToEmail}
                                    className="flex-[2] py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                                >
                                    {isLoading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Already have an account? <Link to="/teacher/login" className="font-bold text-primary-green hover:underline">Sign in</Link>
                        </p>
                        
                        {/* WhatsApp Support */}
                        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700/50">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                                Having trouble registering or need help understanding something? We are here to help
                            </p>
                            <a 
                                href="https://wa.me/12048009763?text=%D8%A3%D9%86%D8%A7%20%D9%85%D8%B9%D9%84%20%D9%88%D8%AA%D9%88%D8%A7%D8%AC%D9%87%D9%86%D9%8A%20%D9%85%D8%B4%D9%83%D9%84%D8%A9%20%D1%81%D9%8A%20%D8%A5%D9%86%D8%B4%D8%A7%D8%A1%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-all border border-green-100 dark:border-green-800/30"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                </svg>
                                Contact us on WhatsApp
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RegisterTeacher;
