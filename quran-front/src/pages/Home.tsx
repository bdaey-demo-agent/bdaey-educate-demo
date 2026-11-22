import React from 'react';
import { branding } from '../branding';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100 transition-colors duration-300">

            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-12 sm:py-20 lg:py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl mb-6">
                            تعلم وحفظ القرآن والعلوم الشرعية مع <span className="text-gold-500">أفضل المشايخ</span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            منصتك المتخصصة لحفظ كتاب الله وتعلم العلوم الشرعية على يد نخبة من المعلمين المعتمدين عبر الإنترنت.
                        </p>
                    </motion.div>

                    <motion.div
                        className="mt-10 flex items-center justify-center gap-x-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <Link
                            to="/teachers-public"
                            className="rounded-md bg-primary-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all hover:scale-105 transform duration-200"
                        >
                            ابحث عن محفظ
                        </Link>
                        <Link
                            to="/register/teacher"
                            className="text-lg font-semibold leading-6 text-gray-900 dark:text-white hover:text-gold-500 transition-colors flex items-center gap-2 group"
                        >
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                انضم كمعلم
                            </motion.span>
                            <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">←</span>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white dark:bg-gray-800 py-16 sm:py-24 transition-colors duration-300">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-12">
                        <h2 className="text-base font-semibold leading-7 text-gold-500">لماذا {branding.nameAr}؟</h2>
                        <motion.p
                            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            بيئة إيمانية تعليمية متميزة
                        </motion.p>
                    </div>
                    <div className="mx-auto max-w-2xl lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                            {[
                                {
                                    icon: MagnifyingGlassIcon,
                                    title: 'نخبة من الحفاظ',
                                    desc: 'جميع المعلمين لدينا مجازون وحافظون لكتاب الله ومؤهلون لتدريس العلوم الشرعية.'
                                },
                                {
                                    icon: AcademicCapIcon,
                                    title: 'مناهج معتمدة',
                                    desc: 'نعتمد مسارات تعليمية منهجية للتلاوة، الحفظ، التجويد، والعقيدة والفقه.'
                                },
                                {
                                    icon: UserGroupIcon,
                                    title: 'حلقات ذكر افتراضية',
                                    desc: 'أجواء روحانية تفاعلية عبر فصولنا الافتراضية، تحاكي حلقات التحفيظ في المساجد.'
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    className="flex flex-col items-center text-center"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.2, duration: 0.6 }}
                                >
                                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gold-500/10">
                                        <feature.icon className="h-8 w-8 text-gold-500" aria-hidden="true" />
                                    </div>
                                    <dt className="text-xl font-semibold leading-7 text-gray-900 dark:text-white">{feature.title}</dt>
                                    <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                                        <p className="flex-auto">{feature.desc}</p>
                                    </dd>
                                </motion.div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
