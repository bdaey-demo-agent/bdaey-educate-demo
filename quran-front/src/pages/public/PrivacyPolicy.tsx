import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo';

const PrivacyPolicy: React.FC = () => {
    return (
        <>
            <Seo
                title="سياسة الخصوصية"
                description="سياسة الخصوصية لمنصة بدائي: كيف نحمي بياناتك ومعلوماتك الشخصية عند استخدام خدمات تحفيظ القرآن الكريم."
                canonical="https://bdaey.com/privacy"
            />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-body transition-colors duration-300">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden p-8 sm:p-12">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-primary-green dark:text-white font-heading mb-4">سياسة الخصوصية</h1>
                    <p className="text-gray-500 dark:text-gray-400">آخر تحديث: ٢٦/١/٢٠٢٦</p>
                </div>

                <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    <p>
                        نحن في منصة <span className="font-bold text-primary-green dark:text-gold-500">بدائي (Bdaey)</span> نولي اهتماماً كبيراً بخصوصية بيانات مستخدمينا، سواء كانوا طلاباً أو معلمين. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية عند استخدامك لمنصتنا.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">1. المعلومات التي نجمعها</h2>
                        <p className="mb-4">نقوم بجمع المعلومات التالية لتقديم خدماتنا بشكل أفضل:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li><span className="font-bold">معلومات الحساب:</span> الاسم الكامل، البريد الإلكتروني، رقم الهاتف، تاريخ الميلاد، والنوع.</li>
                            <li><span className="font-bold">بيانات المعلمين:</span> المؤهلات العلمية، الشهادات (الإجازات)، السيرة الذاتية، وعينات صوتية. قد نطلب صورة من الهوية الوطنية للتحقق من هوية المعلم.</li>
                            <li><span className="font-bold">المعاملات المالية:</span> سجلات الشحن في المحفظة، عمليات الدفع للمحاضرات، واستلام الأرباح للمعلمين.</li>
                            <li><span className="font-bold">بيانات الجلسات:</span> تفاصيل الحجوزات، تواريخ الجلسات، التقييمات، والملاحظات المتبادلة بين الطالب والمعلم.</li>
                            <li><span className="font-bold">المراسلات:</span> الرسائل المتبادلة عبر نظام المحادثة الداخلي للمنصة لأغراض الدعم والتوثيق.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">2. كيف نستخدم معلوماتك</h2>
                        <p className="mb-4">نستخدم البيانات للأغراض التالية:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li><span className="font-bold">إدارة الحجوزات:</span> لتنسيق المواعيد بين الطلاب والمعلمين وتوليد روابط الغرف الصوتية/المرئية الخاصة بالدرس تلقائياً عبر المنصة.</li>
                            <li><span className="font-bold">تحسين الجودة:</span> مراجعة التقييمات والشكاوى لضمان جودة التعليم.</li>
                            <li><span className="font-bold">المعاملات المالية:</span> خصم رسوم الحصص من رصيد الطالب وإضافة المستحقات لمحفظة المعلم.</li>
                            <li><span className="font-bold">الأمان والتحقق:</span> التأكد من هوية المعلمين لضمان بيئة تعليمية آمنة.</li>
                            <li><span className="font-bold">التواصل:</span> إرسال إشعارات بتأكيد الحجز، التذكيرات، أو التحديثات الهامة حول المنصة.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">3. مشاركة المعلومات</h2>
                        <p className="mb-4">نحن لا نبيع بياناتك الشخصية لأي طرف ثالث. تتم مشاركة البيانات فقط في الحالات التالية:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li><span className="font-bold">بين الطالب والمعلم:</span> يظهر للمعلم اسم الطالب وتفاصيل الحجز، ويظهر للطالب الملف التعريفي للمعلم وخبراته.</li>
                            <li><span className="font-bold">الامتثال القانوني:</span> إذا طُلب منا ذلك بموجب القانون أو لحماية حقوق المنصة.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">4. أمن البيانات</h2>
                        <p>
                            نتخذ تدابير أمنية تقنية وتنظيمية لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الكشف. يتم تشفير كلمات المرور وتأمين الاتصالات عبر بروتوكولات آمنة (HTTPS).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">5. ملفات تعريف الارتباط (Cookies)</h2>
                        <p>
                            نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم، مثل تذكر حالة تسجيل الدخول لسهولة العودة للمنصة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">6. حقوقك</h2>
                        <p className="mb-4">لك الحق في:</p>
                        <ul className="list-disc list-inside space-y-2 mr-4">
                            <li>الوصول إلى بياناتك الشخصية وتعديلها من خلال صفحة "حسابي".</li>
                            <li>طلب حذف حسابك (يرجى التواصل مع الدعم الفني).</li>
                            <li>التحكم في الإشعارات التي تصلك.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">7. التغييرات على سياسة الخصوصية</h2>
                        <p>
                            قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.
                        </p>
                    </section>

                    <div className="mt-12 p-6 bg-gold-50 dark:bg-gold-900/10 rounded-lg border border-gold-100 dark:border-gold-500/20 text-center">
                        <h3 className="text-lg font-bold text-gold-600 mb-2">تواصل معنا</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            إذا كان لديك أي استفسار بخصوص سياسة الخصوصية، يرجى التواصل معنا عبر صفحة
                        </p>
                        <Link to="/contact" className="btn-gold inline-block">
                            اتصل بنا
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default PrivacyPolicy;
