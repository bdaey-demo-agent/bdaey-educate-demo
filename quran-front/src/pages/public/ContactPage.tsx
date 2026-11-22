import React, { useState } from 'react';
import { branding } from '../../branding';
import Seo from '../../components/common/Seo';
import messageService from '../../services/messageService';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ContactPage: React.FC = () => {
    return (
        <>
            <Seo
                title="Contact Us"
                description={`Contact the ${branding.nameEn} team. Questions, suggestions, or technical support, we are here to help.`}
                canonical="https://bdaey.com/contact"
            />
            <ContactForm />
        </>
    )
}

function ContactForm() {
    const { user } = useAuth();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Collect form data
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const data = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                reason: formData.get('reason') as string,
                subject: 'New Inquiry from Contact Form',
                message: formData.get('message') as string
            };

            await messageService.sendMessage({
                ...data,
                subject: data.reason === 'Suspension' ? 'Account suspension appeal' : 'Message from the contact form'
            });

            setSubmitted(true);
            toast.success('Your message was sent! We will get back to you soon.');
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while sending. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden md:max-w-2xl">
                <div className="md:flex">

                    <div className="p-8 w-full">
                        <div className="uppercase tracking-wide text-sm text-blue-500 font-semibold mb-1">Support</div>
                        <h1 className="block mt-1 text-lg leading-tight font-medium text-gray-900 dark:text-white">Contact Us</h1>
                        <p className="mt-2 text-gray-500">We are here to help. Fill out the form and we will reply as soon as possible.</p>

                        {/* WhatsApp Contact */}
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-green-800 dark:text-green-400">Quick contact via WhatsApp</p>
                            </div>
                            <a
                                href="https://wa.me/12048009763"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                +1 204-800-9763
                            </a>
                        </div>

                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        defaultValue={user?.fullName || ''}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                                    <select name="reason" id="reason" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600">
                                        <option value="General">General inquiry</option>
                                        <option value="Suspension">Account suspension</option>
                                        <option value="Suggestion">Suggestion</option>
                                        <option value="Complaint">Complaint</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        required
                                        defaultValue={user?.email || ''}
                                        readOnly={!!user?.email}
                                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 ${user?.email ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                                    <textarea id="message" name="message" rows={4} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"></textarea>
                                </div>
                                <div>
                                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        Send
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mt-6 text-center py-10 bg-green-50 rounded-lg">
                                <p className="text-green-800 font-medium">Thank you! Your message has been received.</p>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
