import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import adminService from '../../services/adminService';
import type { AdminTeacher } from '../../types/adminTypes';
import walletService from '../../services/walletService';
import type { BulkDepositDto } from '../../services/walletService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BulkDepositModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [amount, setAmount] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTeachers();
            resetForm();
        }
    }, [isOpen]);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const data = await adminService.getTeachers();
            // Filter only approved teachers
            setTeachers(data.filter(t => t.isApproved));
        } catch (err) {
            console.error(err);
            setError('Failed to load teachers.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedIds([]);
        setIsAllSelected(false);
        setAmount('');
        setDescription('');
        setSearchQuery('');
        setError('');
        setSubmitting(false);
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectAll = (checked: boolean) => {
        setIsAllSelected(checked);
        if (checked) {
            setSelectedIds(teachers.map(t => t.id)); // Select all loaded
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleTeacher = (id: number) => {
        if (isAllSelected) setIsAllSelected(false); // Deselect "All" if manual selection changes

        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(tid => tid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if ((!amount || amount <= 0)) {
            setError('Please enter a valid amount.');
            return;
        }

        if (selectedIds.length === 0 && !isAllSelected) {
            setError('Please select at least one teacher.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: BulkDepositDto = {
                teacherProfileIds: isAllSelected ? [] : selectedIds,
                isAll: isAllSelected,
                amount: Number(amount),
                description: description || 'Bulk Deposit'
            };

            await walletService.adminBulkDeposit(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || 'Deposit failed.');
        } finally {
            setSubmitting(false);
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
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
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
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white flex justify-between items-center mb-4">
                                    <span>إيداع مجمع للمعلمين</span>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Selection Controls */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 max-h-60 flex flex-col">
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <input
                                                    type="checkbox"
                                                    id="selectAll"
                                                    checked={isAllSelected || (teachers.length > 0 && selectedIds.length === teachers.length)}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="h-4 w-4 text-brand-600 rounded border-gray-300 dark:border-gray-600 focus:ring-brand-500 bg-white dark:bg-gray-700"
                                                />
                                                <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 dark:text-gray-300">تحديد الكل ({teachers.length})</label>
                                            </div>

                                            <div className="relative">
                                                <MagnifyingGlassIcon className="h-4 w-4 absolute right-2 top-2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="بحث باسم المعلم..."
                                                    className="pr-8 pl-2 py-1 text-sm border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-y-auto flex-1 pr-1">
                                            {loading ? (
                                                <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
                                            ) : filteredTeachers.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500">لا يوجد معلمين مطابقين.</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {filteredTeachers.map(teacher => (
                                                        <div key={teacher.id} className="flex items-center space-x-3 space-x-reverse hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded">
                                                            <input
                                                                type="checkbox"
                                                                id={`teacher-${teacher.id}`}
                                                                checked={selectedIds.includes(teacher.id)}
                                                                onChange={() => handleToggleTeacher(teacher.id)}
                                                                className="h-4 w-4 text-brand-600 rounded border-gray-300 dark:border-gray-600 focus:ring-brand-500 bg-white dark:bg-gray-700"
                                                            />
                                                            <label htmlFor={`teacher-${teacher.id}`} className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer flex-1 text-right">
                                                                {teacher.name} <span className="text-gray-500 dark:text-gray-400 text-xs">({teacher.email})</span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount & Description */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ (للمعلم الواحد)</label>
                                            <div className="relative rounded-md shadow-sm">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="0.01"
                                                    value={amount}
                                                    onChange={(e) => setAmount(Number(e.target.value))}
                                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 pr-3 pl-12 focus:border-brand-500 focus:ring-brand-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">EGP</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (يظهر في المعاملات)</label>
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                placeholder="مكافأة شهرية..."
                                            />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-sm text-blue-800 dark:text-blue-300">
                                        سيتم إيداع مبلغ <strong>{amount || 0} EGP</strong> في محافظ <strong>{isAllSelected ? teachers.length : selectedIds.length}</strong> معلمين.
                                        <br />
                                        الإجمالي التقديري: <strong>{((Number(amount) || 0) * (isAllSelected ? teachers.length : selectedIds.length)).toLocaleString()} EGP</strong>
                                    </div>

                                    {error && (
                                        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                            onClick={onClose}
                                            disabled={submitting}
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                            disabled={submitting || loading}
                                        >
                                            {submitting ? 'جاري التنفيذ...' : 'تأكيد الإيداع'}
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

export default BulkDepositModal;
