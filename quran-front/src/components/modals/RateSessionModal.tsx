import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import sessionsService from '../../services/sessionsService';
import toast from 'react-hot-toast';

interface RateSessionModalProps {
    sessionId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RateSessionModal: React.FC<RateSessionModalProps> = ({ sessionId, isOpen, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('يرجى تحديد تقييم');
            return;
        }

        try {
            setSubmitting(true);
            await sessionsService.rateSession(sessionId, rating, comment);
            toast.success('تم إرسال تقييمك بنجاح');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error rating session:', error);
            toast.error('حدث خطأ أثناء إرسال التقييم');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                    كيف كانت حصتك؟
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                {rating >= star ? (
                                    <StarIcon className="h-10 w-10 text-yellow-400" />
                                ) : (
                                    <StarIconOutline className="h-10 w-10 text-gray-300 dark:text-gray-600 hover:text-yellow-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            تعليق (اختياري)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                            placeholder="اكتب ملاحظاتك هنا..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg shadow-lg hover:shadow-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RateSessionModal;
