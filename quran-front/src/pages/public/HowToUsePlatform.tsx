import React from "react";
import { branding } from '../../branding';
import { Link } from "react-router-dom";
import Seo from "../../components/common/Seo";

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
            title: "Create an Account and Sign In",
            youDo: "Sign up as a student, then log into your account.",
            systemDoes:
                "Sets up your student dashboard and shows you the available packages and teachers.",
        },
        {
            title: "Browse Teachers and Packages",
            youDo: "Pick a teacher and a package that suits you (price / number of sessions / duration / availability).",
            systemDoes:
                "Shows package details and slot availability, and makes booking clear and simple.",
        },
        {
            title: "Top Up Your Wallet Before Booking",
            youDo: "Top up your wallet if your balance is not enough.",
            systemDoes:
                "Automatically blocks the booking if the balance is insufficient and shows you the reason clearly.",
        },
        {
            title: "Book a Package",
            youDo: "Choose the package and pick the suggested times that suit you.",
            systemDoes:
                "Checks for conflicts, creates the booking (Pending), and automatically generates sessions based on the package.",
        },
        {
            title: "Track Your Booking Status",
            youDo: "Track the booking status from your dashboard.",
            systemDoes:
                "The booking stays (Pending) until the teacher accepts it. Once accepted, it becomes (Confirmed).",
        },
        {
            title: "Attend Sessions in the Classroom",
            youDo: "Enter the classroom from your schedule at session time.",
            systemDoes:
                "Runs the live classroom and shows the session status (Scheduled / In Progress / Completed).",
        },
        {
            title: "Rate the Session After It Ends",
            youDo: "Rate the session once it is finished.",
            systemDoes:
                "Records your rating with the teacher's ratings and updates the average.",
        },
    ];

    const teacherSteps: Step[] = [
        {
            title: "Create an Account and Verify Your Email",
            youDo: "Sign up as a teacher and verify your email via the verification link.",
            systemDoes:
                "Blocks sign-in before email verification to ensure account security and quality.",
        },
        {
            title: "Create Teaching Packages",
            youDo:
                "Set the price, session duration, number of sessions, and your available days/hours.",
            systemDoes:
                "Builds a clear package for students and computes availability from your settings.",
        },
        {
            title: "Receive Bookings and Accept/Decline",
            youDo: "Review new bookings, then accept or decline with a reason.",
            systemDoes:
                "On acceptance the booking becomes (Confirmed); on decline it becomes (Cancelled) and the student is refunded per policy.",
        },
        {
            title: "Manage Your Session Schedule",
            youDo: "Follow your schedule and prepare for upcoming sessions.",
            systemDoes:
                "Shows session statuses, prevents conflicts, and keeps everything organized in the teacher dashboard.",
        },
        {
            title: "Start the Session at the Right Time",
            youDo: "Start the session from the session page when it is time.",
            systemDoes:
                "Prevents starting a session too early (more than 15 minutes before its time).",
        },
        {
            title: "Complete and End the Session",
            youDo: "End the session when you are done.",
            systemDoes:
                "Marks the session (Completed) and prepares it for rating and record updates.",
        },
        {
            title: "Important Note: Deleting a Package",
            youDo: "Delete a package only when necessary.",
            systemDoes:
                "This may cancel related bookings, refund students, and a penalty may apply under platform policies.",
        },
    ];

    const scenarios: Scenario[] = [
        {
            q: "What if I try to book with insufficient balance?",
            a: "The booking will not complete, and you will see an insufficient-balance message. Top up your wallet and try again.",
        },
        {
            q: "What if the suggested times conflict?",
            a: "The system blocks the booking and asks you to choose conflict-free times.",
        },
        {
            q: "What if the teacher declines the booking?",
            a: "The booking becomes (Cancelled) and the refund is handled per platform policies.",
        },
        {
            q: "What if the teacher tries to start the session early?",
            a: "The system refuses to start the session before the allowed time (e.g. earlier than 15 minutes before the slot).",
        },
        {
            q: "What if I run into any problem?",
            a: "You can reach us through the Contact Us page.",
        },
        {
            q: "What if the teacher does not show up?",
            a: "You can report the issue; it will be reviewed and you will be fully refunded.",
        },
    ];

    const faqs: Scenario[] = [
        {
            q: "Can I book with a teacher in a different country?",
            a: "Yes. The platform presents times clearly according to timezone settings so the schedule is unambiguous for both sides.",
        },
        {
            q: "Can I cancel a booking?",
            a: "Cancellation is available in specific states (such as Pending) under the applicable refund policies.",
        },
        {
            q: "Can the teacher change the package after a request is made?",
            a: "Packages can be edited from the teacher dashboard, but existing bookings are affected according to platform policies.",
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
                                            <span className="font-semibold">You do:</span>{" "}
                                            {s.youDo}
                                        </p>
                                        <p>
                                            <span className="font-semibold">The platform does:</span>{" "}
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
        <>
            <Seo
                title={`${branding.nameEn} User Guide`}
                description={`A complete guide to using ${branding.nameEn}: detailed instructions for students and teachers on browsing teachers, booking sessions, and managing packages.`}
                canonical="https://bdaey.com/how-to-use"
            />
            <div className="font-body bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* HERO */}
            <section className="py-14">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-sm">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                            How to Use the Platform
                        </h1>
                        <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl">
                            A step-by-step guide for students and teachers: from creating an account, to booking,
                            to attending sessions in the live classroom.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => scrollTo("student")}
                                className="px-5 py-3 rounded-2xl bg-gray-900 text-white hover:opacity-90"
                            >
                                Start as a Student
                            </button>
                            <button
                                onClick={() => scrollTo("teacher")}
                                className="px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:opacity-90"
                            >
                                Start as a Teacher
                            </button>

                            <div className="flex-1" />

                            <Link
                                to="/teachers-public"
                                className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:opacity-90"
                            >
                                Browse Teachers
                            </Link>
                        </div>
                    </div>

                    {/* Quick overview */}
                    <div className="grid md:grid-cols-3 gap-5 mt-6">
                        {[
                            {
                                t: "1) Choose a suitable package",
                                d: "Browse teachers and pick a package by price, duration, and availability.",
                            },
                            {
                                t: "2) Book and track the status",
                                d: "Pick your suggested times and track the teacher's acceptance.",
                            },
                            {
                                t: "3) Attend and rate",
                                d: "Enter the classroom on time, then rate the session afterwards.",
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
                title="How to Use the Platform as a Student"
                subtitle="The student journey from signing up to attending and rating sessions."
                steps={studentSteps}
            />

            {/* Teacher */}
            <StepsSection
                id="teacher"
                title="How to Use the Platform as a Teacher"
                subtitle="The teacher journey: creating packages, receiving bookings, and managing sessions."
                steps={teacherSteps}
            />

            {/* Scenarios */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        If This Happens... That Happens
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Quick scenarios explaining how the platform behaves in common cases.
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
                        Frequently Asked Questions
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
                                Ready to Start?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Create your account or browse teachers and start your first session.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <Link
                                to="/register/student"
                                className="px-5 py-3 rounded-2xl bg-gray-900 text-white hover:opacity-90"
                            >
                                Student Sign Up
                            </Link>
                            <Link
                                to="/register/teacher"
                                className="px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:opacity-90"
                            >
                                Teacher Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        </>
    );
};

export default HowToUsePlatform;
