import React from "react";
import { Link } from "react-router-dom";

type Step = {
    title: string;
    youDo: string;
    systemDoes: string;
};

type Scenario = {
    q: string;
    a: string;
};

const HowToUsePlatform: React.FC = () => {
    const studentSteps: Step[] = [
        {
            title: "إنشاء حساب وتسجيل الدخول",
            youDo: "سجّل كطالب ثم ادخل لحسابك.",
            systemDoes:
                "يجهّز لك لوحة تحكم الطالب ويعرض لك الباقات والمعلمين المتاحين.",
        },
        {
            title: "تصفح المعلمين والباقات",
            youDo: "اختار معلم وباقة تناسبك (السعر/عدد الجلسات/المدة/التوفر).",
            systemDoes:
                "يعرض تفاصيل الباقة وتوفر المواعيد ويجهز تجربة الحجز بشكل واضح.",
        },
        {
            title: "شحن المحفظة قبل الحجز",
            youDo: "اشحن محفظتك لو الرصيد غير كافي.",
            systemDoes:
                "يمنع إتمام الحجز تلقائيًا لو الرصيد غير كافي ويظهر لك السبب بوضوح.",
        },
        {
            title: "عمل حجز للباقة",
            youDo: "اختار الباقة وحدد المواعيد المقترحة المناسبة لك.",
            systemDoes:
                "يتحقق من التعارضات، ينشئ الحجز (قيد الانتظار)، ويولّد جلسات تلقائيًا بحسب الباقة.",
        },
        {
            title: "متابعة حالة الحجز",
            youDo: "تابع حالة الحجز من لوحة التحكم.",
            systemDoes:
                "الحجز يظل (قيد الانتظار) حتى يقبله المعلم. عند القبول يتحول (مؤكد).",
        },
        {
            title: "حضور الجلسات داخل القاعة",
            youDo: "ادخل من جدولك للقاعة في وقت الجلسة.",
            systemDoes:
                "يشغّل القاعة المباشرة ويعرض حالة الجلسة (مجدولة / جارية / مكتملة).",
        },
        {
            title: "تقييم الجلسة بعد الانتهاء",
            youDo: "قيّم الجلسة بعد ما تنتهي.",
            systemDoes:
                "يسجل تقييمك ضمن تقييمات المعلم ويحدّث متوسط التقييمات.",
        },
    ];

    const teacherSteps: Step[] = [
        {
            title: "إنشاء حساب وتأكيد البريد",
            youDo: "سجّل كمعلم وفعّل البريد من رابط التحقق.",
            systemDoes:
                "يمنع تسجيل الدخول قبل تأكيد البريد لضمان الأمان وجودة الحسابات.",
        },
        {
            title: "إنشاء باقات تعليمية",
            youDo:
                "حدد السعر، مدة الجلسة، عدد الجلسات، وأيام/ساعات التوفر.",
            systemDoes:
                "يبني باقة واضحة للطلاب ويحسب التوفر بناءً على إعداداتك.",
        },
        {
            title: "استقبال الحجوزات وقبول/رفض",
            youDo: "راجع الحجوزات الجديدة ثم اقبل أو ارفض مع سبب.",
            systemDoes:
                "عند القبول يتحول الحجز (مؤكد)، وعند الرفض يتحول (ملغى) ويتم رد المبلغ للطالب حسب النظام.",
        },
        {
            title: "إدارة جدول الجلسات",
            youDo: "تابع جدولك وجهز للجلسات القادمة.",
            systemDoes:
                "يعرض حالات الجلسات ويمنع التعارض ويظهر كل شيء منظم داخل لوحة المعلم.",
        },
        {
            title: "بدء الجلسة في الوقت الصحيح",
            youDo: "ابدأ الجلسة من صفحة الجلسة وقتها.",
            systemDoes:
                "يمنع بدء الجلسة مبكرًا بشكل زائد (أكثر من 15 دقيقة قبل الموعد).",
        },
        {
            title: "إكمال الجلسة وإنهائها",
            youDo: "انهِ الجلسة بعد الانتهاء.",
            systemDoes:
                "يحوّل الجلسة (مكتملة) ويجهزها للتقييم وتحديث السجلات.",
        },
        {
            title: "تنبيه مهم: حذف باقة",
            youDo: "احذف الباقة فقط عند الضرورة.",
            systemDoes:
                "قد يلغي الحجوزات المرتبطة ويسترد الطلاب أموالهم، وقد تُطبق غرامة وفق سياسات المنصة.",
        },
    ];

    const scenarios: Scenario[] = [
        {
            q: "لو حاولت أحجز والرصيد غير كافي؟",
            a: "لن يكتمل الحجز، وستظهر رسالة أن الرصيد غير كافي. اشحن المحفظة ثم أعد المحاولة.",
        },
        {
            q: "لو المواعيد المقترحة فيها تعارض؟",
            a: "النظام يمنع الحجز ويطلب منك اختيار مواعيد أخرى بدون تعارض.",
        },
        {
            q: "لو المعلم رفض الحجز؟",
            a: "الحجز يتحول إلى (ملغى) ويتم التعامل مع الاسترداد حسب سياسات المنصة.",
        },
        {
            q: "لو المعلم حاول يبدأ الجلسة بدري؟",
            a: "النظام يرفض بدء الجلسة قبل الوقت المسموح (مثلاً قبل 15 دقيقة من الموعد).",
        },
        {
            q: "لو حصل معاك اي مشكله ",
            a: "يمكنك التواصل معنا عبر صفحة 'اتصل بنا'.",
        },
        {
            q: "لو المعلم لم يحضر الجلسه ",
            a: "يمكنك الإبلاغ عن المشكلة، وسيتم مراجعة الأمر وإعادة حقك بالكامل.",
        },
    ];

    const faqs: Scenario[] = [
        {
            q: "هل أقدر أحجز مع معلم من دولة مختلفة؟",
            a: "نعم. المنصة تعرض المواعيد بشكل منظم حسب إعدادات التوقيت لضمان وضوح الموعد لكل طرف.",
        },
        {
            q: "هل أقدر ألغي الحجز؟",
            a: "المنصة توفر الإلغاء وفق حالات محددة (مثل قيد الانتظار) وسياسات الاسترداد المطبقة.",
        },
        {
            q: "هل المعلم يقدر يغير الباقة بعد ما الطلب اتعمل؟",
            a: "يمكن تعديل/إدارة الباقات من لوحة المعلم، لكن الحجوزات القائمة تتأثر حسب سياسات المنصة.",
        },
    ];

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const StepsSection = ({
        id,
        title,
        subtitle,
        steps,
    }: {
        id: string;
        title: string;
        subtitle: string;
        steps: Step[];
    }) => (
        <section id={id} className="py-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{subtitle}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    {steps.map((s, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {s.title}
                                    </h3>
                                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                                        <p>
                                            <span className="font-semibold">أنت تعمل:</span>{" "}
                                            {s.youDo}
                                        </p>
                                        <p>
                                            <span className="font-semibold">المنصة تعمل:</span>{" "}
                                            {s.systemDoes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    return (
        <div className="font-body bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* HERO */}
            <section className="py-14">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-sm">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                            كيفية استخدام المنصة
                        </h1>
                        <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl">
                            دليل خطوة بخطوة للطلاب والمعلمين: من إنشاء الحساب، إلى الحجز،
                            ثم حضور الجلسات داخل القاعة المباشرة.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => scrollTo("student")}
                                className="px-5 py-3 rounded-2xl bg-gray-900 text-white hover:opacity-90"
                            >
                                ابدأ كطالب
                            </button>
                            <button
                                onClick={() => scrollTo("teacher")}
                                className="px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:opacity-90"
                            >
                                ابدأ كمعلم
                            </button>

                            <div className="flex-1" />

                            <Link
                                to="/teachers-public"
                                className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:opacity-90"
                            >
                                تصفح المعلمين
                            </Link>
                        </div>
                    </div>

                    {/* Quick overview */}
                    <div className="grid md:grid-cols-3 gap-5 mt-6">
                        {[
                            {
                                t: "1) اختر باقة مناسبة",
                                d: "تصفح المعلمين واختر باقة حسب السعر والمدة والتوفر.",
                            },
                            {
                                t: "2) احجز وتابع الحالة",
                                d: "حدد مواعيدك المقترحة وتابع قبول المعلم للحجز.",
                            },
                            {
                                t: "3) احضر وقيّم",
                                d: "ادخل القاعة في الموعد، ثم قيّم الجلسة بعد الانتهاء.",
                            },
                        ].map((x, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {x.t}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    {x.d}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Student */}
            <StepsSection
                id="student"
                title="كيفية استخدام المنصة كطالب"
                subtitle="مسار الطالب من أول التسجيل لحد حضور الجلسات وتقييمها."
                steps={studentSteps}
            />

            {/* Teacher */}
            <StepsSection
                id="teacher"
                title="كيفية استخدام المنصة كمعلم"
                subtitle="مسار المعلم لإنشاء الباقات واستقبال الحجوزات وإدارة الجلسات."
                steps={teacherSteps}
            />

            {/* Scenarios */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        لو حصل كذا… يحصل كذا
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        سيناريوهات سريعة لتوضيح سلوك المنصة في الحالات الشائعة.
                    </p>

                    <div className="grid md:grid-cols-2 gap-5 mt-6">
                        {scenarios.map((s, i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {s.q}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    {s.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        الأسئلة الشائعة
                    </h2>

                    <div className="mt-6 space-y-3">
                        {faqs.map((f, i) => (
                            <details
                                key={i}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5"
                            >
                                <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100">
                                    {f.q}
                                </summary>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    {f.a}
                                </p>
                            </details>
                        ))}
                    </div>

                    <div className="mt-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                جاهز تبدأ؟
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                أنشئ حسابك أو تصفح المعلمين وابدأ أول جلسة.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <Link
                                to="/register/student"
                                className="px-5 py-3 rounded-2xl bg-gray-900 text-white hover:opacity-90"
                            >
                                تسجيل طالب
                            </Link>
                            <Link
                                to="/register/teacher"
                                className="px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:opacity-90"
                            >
                                تسجيل معلم
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HowToUsePlatform;
