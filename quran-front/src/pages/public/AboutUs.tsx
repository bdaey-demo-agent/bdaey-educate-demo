import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';
import {
    HeartIcon,
    SparklesIcon,
    AcademicCapIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    LightBulbIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

const AboutUs: React.FC = () => {
    return (
        <>
            <Seo
                title="عن بدائي"
                description="منصة بدائي: منصة رائدة لتعليم القرآن الكريم أونلاين. تعرف على قصتنا، رسالتنا، وفريق المعلمين المجازين لدينا."
                canonical="https://bdaey.com/about"
            />
            <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold-500/10 rounded-full -ml-36 -mb-36 blur-3xl"></div>
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 font-heading leading-tight">
                        منصة <span className="text-gold-400 font-extrabold">بدائي</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                        نحو رحلة إيمانية وتعليمية متكاملة تربطك بأمهر المعلمين المجازين في القرآن الكريم واللغة العربية.
                    </p>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-20 container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
                    <div className="lg:w-1/2 space-y-6">
                        <h2 className="text-3xl font-bold text-primary-900 dark:text-gold-400 font-heading">قصتنا</h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                            بدأت فكرة "بدائي" لسد الفجوة في تعليم القرآن الكريم واللغة العربية في عصر التكنولوجيا المتسارع. نحن نؤمن أن التعليم الرقمي لا يجب أن يكون مجرد نقل للمعلومة، بل تجربة إنسانية وروحانية تربط الطالب بمعلم موجه يقوده خطوة بخطوة.
                        </p>
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                            من قلب الحاجة إلى التيسير والإتقان، انطلقت منصتنا لتكون الجسر الموثوق بين راغبي العلم في كل مكان، وبين نخبة من أفضل الكوادر التعليمية المجازة والمؤهلة.
                        </p>
                    </div>
                    <div className="lg:w-1/2 relative">
                        <div className="aspect-video bg-gradient-to-tr from-primary-100 to-primary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-2xl flex items-center justify-center p-8 border-2 border-primary-200 dark:border-gray-600">
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center transform hover:scale-105 transition-transform">
                                    <GlobeAltIcon className="h-10 w-10 text-primary-600 mx-auto mb-2" />
                                    <p className="font-bold">خدمة عالمية</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center transform sm:translate-y-4 hover:scale-105 transition-transform">
                                    <CheckBadgeIcon className="h-10 w-10 text-primary-600 mx-auto mb-2" />
                                    <p className="font-bold">معلمون مجازون</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-center transform hover:scale-105 transition-transform">
                                    <HeartIcon className="h-10 w-10 text-gold-500 mx-auto mb-2" />
                                    <p className="font-bold">بيئة آمنة</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-20 bg-primary-900/5 dark:bg-black/20">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-primary-100 dark:border-gray-700">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <LightBulbIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 font-heading text-primary-900 dark:text-white">رؤيتنا</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                أن نكون المنصة العالمية الأولى التي تربط المسلمين بمنبع العلم الشرعي واللغوي الموثوق، مستخدمين أحدث التقنيات لنشر كلام الله ولغة كتابه العزيز.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-primary-100 dark:border-gray-700">
                            <div className="w-16 h-16 bg-gold-50 dark:bg-gold-900/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <AcademicCapIcon className="h-10 w-10 text-gold-600 dark:text-gold-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 font-heading text-primary-900 dark:text-white">رسالتنا</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                تمكين كل راغب في التعلم من الوصول إلى كبار المعلمين المجازين بسهولة وأمان، وتوفير بيئة تعليمية محفزة تساعد على الحفظ والإتقان.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24 container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-primary-900 dark:text-gold-400 mb-4 font-heading">قيمنا الأساسية</h2>
                    <div className="w-20 h-1.5 bg-gold-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { title: 'الأمانة', desc: 'نلتزم بأعلى معايير المصداقية في اختيار المعلمين وحفظ خصوصية طلابنا.', icon: ShieldCheckIcon },
                        { title: 'الإتقان', desc: 'نهدف لتقديم أفضل تجربة تعليمية بتركيز كامل على الجودة والنتائج.', icon: CheckBadgeIcon },
                        { title: 'التيسير', desc: 'نسعى لجعل عملية طلب العلم سهلة، ممتعة، ومتاحة للجميع بضغطة زر.', icon: SparklesIcon },
                        { title: 'الابتكار', desc: 'نطور أدواتنا التعليمية باستمرار لتواكب تطلعات الأجيال وتحديات المستقبل.', icon: LightBulbIcon },
                    ].map((value, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow text-center group">
                            <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                <value.icon className="h-8 w-8 text-primary-700 dark:text-primary-400" />
                            </div>
                            <h4 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">{value.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary-900 dark:bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-primary-900 opacity-50"></div>
                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8 font-heading">ابدأ رحلتك التعليمية الآن</h2>
                    <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto">
                        سواء كنت معلماً ترغب في نشر علمك، أو طالباً يبحث عن الإتقان، مكانك هنا معنا.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                        <Link 
                            to="/register/student" 
                            className="w-full sm:w-64 py-4 bg-gold-500 hover:bg-gold-600 text-gray-900 font-black rounded-2xl shadow-xl transition-all hover:scale-105 text-lg"
                        >
                            سجل كطالب
                        </Link>
                        <Link 
                            to="/register/teacher" 
                            className="w-full sm:w-64 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all text-lg"
                        >
                            انضم كمعلم
                        </Link>
                    </div>
                </div>
            </section>
        </div>
        </>
    );
};

export default AboutUs;
