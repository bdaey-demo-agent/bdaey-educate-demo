import React from 'react';
import { branding } from '../../branding';
import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';

const TermsOfUse: React.FC = () => {
    return (
        <>
            <Seo
                title="شروط الاستخدام"
                description={`شروط استخدام منصة ${branding.nameAr} لتحفيظ القرآن الكريم. بالاستخدام أنت توافق على جميع الشروط والأحكام المذكورة.`}
                canonical="https://bdaey.com/terms"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-body transition-colors duration-300">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-8 sm:p-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-primary-green dark:text-white font-heading mb-4">شروط الاستخدام</h1>
                    <p className="text-gray-500 dark:text-gray-400">آخر تحديث: ٢٦/١/٢٠٢٦</p>
                </div>

                <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    <p>
                        مرحباً بكم في منصة <span className="font-bold text-primary-green dark:text-gold-500">{branding.nameAr} ({branding.nameEn})</span>.
                        <br />
                        تُعد هذه الشروط عقداً ملزماً بينك (المستخدم) وبين منصة {branding.nameAr}. بمجرد استخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">1. الحسابات والتسجيل</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>يجب أن تكون المعلومات المقدمة أثناء التسجيل دقيقة ومحدثة.</li>
                            <li><span className="font-bold">المعلمون:</span> يلتزم المعلم بتقديم شهادات ومؤهلات صحيحة. تحتفظ المنصة بحق تجميد حساب أي معلم يثبت تقديمه لبيانات مضللة.</li>
                            <li>أنت مسؤول عن الحفاظ على سرية معلومات دخولك وعدم مشاركتها مع الآخرين.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">2. الحجوزات والجلسات</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>يتم حجز الجلسات عبر المنصة والدفع مسبقاً باستخدام الرصيد المشحون في المحفظة.</li>
                            <li><span className="font-bold">الحضور:</span> يجب على الطالب والمعلم الالتزام بوقت الجلسة المحدد.</li>
                            <li>
                                <span className="font-bold">التأخير:</span>
                                <ul className="list-disc list-inside mr-6 mt-1 space-y-1">
                                    <li>يُسمح للطالب بالتأخر لمدة محددة (مثلاً 15 دقيقة) قبل اعتبار الجلسة ملغاة أو مكتملة حسب سياسة المعلم.</li>
                                    <li>في حال تأخر المعلم أو تغيبه، يحق للطالب استرداد المبلغ أو جدولة تعويض.</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">3. الإلغاء والاسترداد</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>يلتزم الطرفان بسياسة الإلغاء الموضحة عند الحجز.</li>
                            <li>في حال الإلغاء قبل الموعد المحدد (مثلاً 24 ساعة)، يتم استرداد المبلغ بالكامل إلى محفظة الطالب.</li>
                            <li>قد يتم فرض رسوم إلغاء في حال الإلغاء المتأخر لتعويض وقت المعلم.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">4. السلوك المهني</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>تلتزم المنصة بتوفير بيئة تعليمية آمنة ومحترمة.</li>
                            <li>يُمنع استخدام أي ألفاظ نابية أو سلوك غير لائق خلال الجلسات أو عبر الرسائل.</li>
                            <li>يحق للمنصة إيقاف حساب أي مستخدم يخالف قواعد السلوك فوراً ودون إنذار مسبق.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">5. الحقوق والملكية الفكرية</h2>
                        <p>
                            جميع المحتويات الموجودة على الموقع (النصوص، التصاميم، الشعارات) هي ملك لمنصة {branding.nameAr}.
                            المحتوى التعليمي المقدم من المعلم يظل ملكاً له، ولكن يمنح المنصة حق عرضه للطلاب المسجلين.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">6. إخلاء المسؤولية</h2>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>تسعى المنصة لضمان جودة المعلمين، ولكنها لا تتحمل المسؤولية القانونية عن أي تصرفات فردية خارجة عن نطاق المنصة.</li>
                            <li>المنصة ليست مسؤولة عن أي انقطاع في الخدمة ناتج عن مشاكل تقنية في شبكة الإنترنت لدى المستخدم.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">7. التعديلات</h2>
                        <p>
                            نحتفظ بحق تعديل هذه الشروط في أي وقت. استمرارك في استخدام المنصة بعد التعديل يعتبر موافقة عليه.
                        </p>
                    </section>

                    <div className="mt-12 p-6 bg-gold-50 dark:bg-gold-900/10 rounded-lg border border-gold-100 dark:border-gold-500/20 text-center">
                        <h3 className="text-lg font-bold text-gold-600 mb-2">تواصل معنا</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            لأي استفسارات قانونية أو شكاوى، يرجى التواصل معنا عبر
                        </p>
                        <Link to="/contact" className="btn-gold inline-block">
                            نموذج الاتصال
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default TermsOfUse;
