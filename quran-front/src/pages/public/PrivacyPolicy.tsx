import React from 'react';
import { branding } from '../../branding';
import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';

const PrivacyPolicy: React.FC = () => {
    return (
        <>
            <Seo
                title="Privacy Policy"
                description={`Privacy policy for ${branding.nameEn}: how we protect your personal data when you use our Quran memorization services.`}
                canonical="https://bdaey.com/privacy"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-body transition-colors duration-300">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-8 sm:p-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-primary-green dark:text-white font-heading mb-4">Privacy Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400">Last updated: January 26, 2026</p>
                </div>

                <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    <p>
                        At <span className="font-bold text-primary-green dark:text-gold-500">{branding.nameEn}</span>, we care deeply about the privacy of our users' data, whether students or teachers. This policy explains how we collect, use, and protect your personal information when you use our platform.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">1. Information We Collect</h2>
                        <p className="mb-4">We collect the following information to provide our services better:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li><span className="font-bold">Account information:</span> full name, email, phone number, date of birth, and gender.</li>
                            <li><span className="font-bold">Teacher data:</span> academic qualifications, certificates (Ijazahs), CV, and audio samples. We may request a copy of a national ID to verify a teacher's identity.</li>
                            <li><span className="font-bold">Financial transactions:</span> wallet top-up records, session payments, and teacher earnings payouts.</li>
                            <li><span className="font-bold">Session data:</span> booking details, session dates, ratings, and notes exchanged between student and teacher.</li>
                            <li><span className="font-bold">Correspondence:</span> messages exchanged through the platform's internal chat for support and record-keeping purposes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">2. How We Use Your Information</h2>
                        <p className="mb-4">We use the data for the following purposes:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li><span className="font-bold">Booking management:</span> to coordinate schedules between students and teachers and automatically generate the lesson's audio/video room links on the platform.</li>
                            <li><span className="font-bold">Quality improvement:</span> reviewing ratings and complaints to ensure teaching quality.</li>
                            <li><span className="font-bold">Financial transactions:</span> deducting session fees from the student's balance and adding earnings to the teacher's wallet.</li>
                            <li><span className="font-bold">Security and verification:</span> verifying teacher identities to ensure a safe learning environment.</li>
                            <li><span className="font-bold">Communication:</span> sending booking confirmations, reminders, and important platform updates.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">3. Information Sharing</h2>
                        <p className="mb-4">We do not sell your personal data to any third party. Data is shared only in the following cases:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li><span className="font-bold">Between student and teacher:</span> the teacher sees the student's name and booking details, and the student sees the teacher's profile and experience.</li>
                            <li><span className="font-bold">Legal compliance:</span> if required by law or to protect the platform's rights.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">4. Data Security</h2>
                        <p>
                            We take technical and organizational security measures to protect your data from unauthorized access, alteration, or disclosure. Passwords are hashed and connections are secured over HTTPS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">5. Cookies</h2>
                        <p>
                            We use cookies to improve the user experience, such as remembering your sign-in state so you can return to the platform easily.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">6. Your Rights</h2>
                        <p className="mb-4">You have the right to:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>Access and edit your personal data from your account page.</li>
                            <li>Request deletion of your account (please contact support).</li>
                            <li>Control the notifications you receive.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">7. Changes to This Policy</h2>
                        <p>
                            We may update this policy from time to time. You will be notified of any material changes by email or an in-platform notice.
                        </p>
                    </section>

                    <div className="mt-12 p-6 bg-gold-50 dark:bg-gold-900/10 rounded-lg border border-gold-100 dark:border-gold-500/20 text-center">
                        <h3 className="text-lg font-bold text-gold-600 mb-2">Contact Us</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            If you have any questions about this privacy policy, please contact us via the
                        </p>
                        <Link to="/contact" className="btn-gold inline-block">
                            Contact Us page
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default PrivacyPolicy;
