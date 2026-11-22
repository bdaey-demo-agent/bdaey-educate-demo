import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { sessionEvaluationService } from '../../services/sessionEvaluationService';
import { toast } from 'react-hot-toast';

interface SessionEvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: number;
    studentId: string; // Add if you need to pass it, or just pass from joinInfo context
    onSubmitted: () => void;
}

const SessionEvaluationModal: React.FC<SessionEvaluationModalProps> = ({
    isOpen,
    onClose,
    sessionId,
    studentId,
    onSubmitted
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [rating, setRating] = useState<number>(5);
    const [memorizedSurah, setMemorizedSurah] = useState('');
    const [memorizedFrom, setMemorizedFrom] = useState('');
    const [memorizedTo, setMemorizedTo] = useState('');

    const [revisedSurah, setRevisedSurah] = useState('');
    const [revisedFrom, setRevisedFrom] = useState('');
    const [revisedTo, setRevisedTo] = useState('');

    const [teacherNotes, setTeacherNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await sessionEvaluationService.createEvaluation({
                sessionId,
                studentId,
                evaluationScore: rating,
                memorizedSurah: memorizedSurah.trim() || undefined,
                memorizedAyahFrom: memorizedFrom ? parseInt(memorizedFrom) : undefined,
                memorizedAyahTo: memorizedTo ? parseInt(memorizedTo) : undefined,
                revisedSurah: revisedSurah.trim() || undefined,
                revisedAyahFrom: revisedFrom ? parseInt(revisedFrom) : undefined,
                revisedAyahTo: revisedTo ? parseInt(revisedTo) : undefined,
                teacherNotes: teacherNotes.trim() || undefined,
            });
            toast.success('تم رفع تقييم الطالب لحصة اليوم بنجاح!');
            onSubmitted();
        } catch (error: any) {
            console.error('Error submitting evaluation', error);
            if (error.response?.data?.includes("already been evaluated")) {
                toast.error('تم تقييم هذه الجلسة مسبقاً.');
                onSubmitted(); // still proceed to close
            } else {
                toast.error('حدث خطأ أثناء إرسال التقييم. حاول مرة أخرى.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto" dir="ltr">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-right align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                                    سجل ومراجعة الحصة
                                </Dialog.Title>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                    يرجى تسجيل الآيات التي تم حفظها ومراجعتها خلال الحصة لتنعكس في ملف إنجاز الطالب.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-6">

                                    {/* Hifz Section */}
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <h4 className="text-blue-800 dark:text-blue-300 font-bold mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> الحفظ الجديد
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">السورة</label>
                                                <input type="text" placeholder="مثال: البقرة" value={memorizedSurah} onChange={(e) => setMemorizedSurah(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">من آية</label>
                                                <input type="number" min="1" placeholder="رقم" value={memorizedFrom} onChange={(e) => setMemorizedFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">إلى آية</label>
                                                <input type="number" min="1" placeholder="رقم" value={memorizedTo} onChange={(e) => setMemorizedTo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revision Section */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                        <h4 className="text-emerald-800 dark:text-emerald-300 font-bold mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> المراجعة (الماضي)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">السورة</label>
                                                <input type="text" placeholder="مثال: الفاتحة" value={revisedSurah} onChange={(e) => setRevisedSurah(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">من آية</label>
                                                <input type="number" min="1" placeholder="رقم" value={revisedFrom} onChange={(e) => setRevisedFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">إلى آية</label>
                                                <input type="number" min="1" placeholder="رقم" value={revisedTo} onChange={(e) => setRevisedTo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evaluation */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">تقييمك لأداء الطالب في الحصة</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="focus:outline-none focus:scale-110 transition-transform hover:scale-110"
                                                >
                                                    {rating >= star ? (
                                                        <StarIcon className="h-10 w-10 text-yellow-500 drop-shadow-sm" />
                                                    ) : (
                                                        <StarOutlineIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">ملاحظات المعلم (ليراها الطالب/ولي الأمر)</label>
                                        <textarea
                                            rows={3}
                                            value={teacherNotes}
                                            onChange={(e) => setTeacherNotes(e.target.value)}
                                            placeholder="اكتب ملاحظات تشجيعية، أو نقاط للتركيز عليها في الواجب..."
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 rounded-xl bg-primary hover:bg-primary-hover px-4 py-3 text-sm font-bold text-white transition-colors flex items-center justify-center disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
                                                </div>
                                            ) : (
                                                "تسجيل الإنجاز وإنهاء الحصة"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default SessionEvaluationModal;
