import React from 'react';
import { branding } from '../../branding';
import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';

const TermsOfUse: React.FC = () => {
    return (
        <>
            <Seo
                title="Terms of Use"
                description={`Terms of use for the ${branding.nameEn} Quran memorization platform. By using it you agree to all stated terms and conditions.`}
                canonical="https://bdaey.com/terms"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-body transition-colors duration-300">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-8 sm:p-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-primary-green dark:text-white font-heading mb-4">Terms of Use</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: January 26, 2026</p>
                </div>

                <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    <p>
                        Welcome to the <span className="font-bold text-primary-green dark:text-gold-500">{branding.nameEn}</span> platform.
                        <br />
                        These terms form a binding contract between you (the user) and the {branding.nameEn} platform. By using the platform, you agree to be bound by these terms.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">1. Accounts and Registration</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>Information provided during registration must be accurate and up to date.</li>
                            <li><span className="font-bold">Teachers:</span> teachers must provide genuine certificates and qualifications. The platform reserves the right to suspend any teacher proven to have submitted misleading information.</li>
                            <li>You are responsible for keeping your login credentials confidential and not sharing them with others.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">2. Bookings and Sessions</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>Sessions are booked through the platform and paid in advance using the wallet balance.</li>
                            <li><span className="font-bold">Attendance:</span> both student and teacher must adhere to the scheduled session time.</li>
                            <li>
                                <span className="font-bold">Lateness:</span>
                                <ul className="list-disc list-inside mr-6 mt-1 space-y-1">
                                    <li>The student may be late for a set period (e.g. 15 minutes) before the session is treated as cancelled or completed according to the teacher's policy.</li>
                                    <li>If the teacher is late or absent, the student is entitled to a refund or a make-up session.</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">3. Cancellation and Refunds</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>Both parties are bound by the cancellation policy shown at booking time.</li>
                            <li>If cancelled before the stated deadline (e.g. 24 hours), the full amount is refunded to the student's wallet.</li>
                            <li>A cancellation fee may apply for late cancellation to compensate for the teacher's time.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">4. Professional Conduct</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>The platform is committed to providing a safe and respectful learning environment.</li>
                            <li>Profanity or inappropriate behavior during sessions or in messages is prohibited.</li>
                            <li>The platform may suspend any user who violates the code of conduct immediately and without prior warning.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">5. Rights and Intellectual Property</h2>
                        <p>
                            All site content (text, designs, logos) is the property of the {branding.nameEn} platform.
                            Educational content provided by a teacher remains their property, but grants the platform the right to display it to registered students.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">6. Disclaimer</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>The platform works to ensure teacher quality but bears no legal responsibility for individual actions outside the platform's scope.</li>
                            <li>The platform is not responsible for service interruptions caused by problems with the user's internet connection.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">7. Amendments</h2>
                        <p>
                            We reserve the right to amend these terms at any time. Continued use of the platform after an amendment constitutes acceptance of it.
                        </p>
                    </section>

                    <div className="mt-12 p-6 bg-gold-50 dark:bg-gold-900/10 rounded-lg border border-gold-100 dark:border-gold-500/20 text-center">
                        <h3 className="text-lg font-bold text-gold-600 mb-2">Contact Us</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            For any legal inquiries or complaints, please contact us via the
                        </p>
                        <Link to="/contact" className="btn-gold inline-block">
                            contact form
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default TermsOfUse;
