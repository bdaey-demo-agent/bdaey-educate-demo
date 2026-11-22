import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { TicketIcon, PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

const AdminPromoCodes: React.FC = () => {
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [newCode, setNewCode] = useState('');
    const [newAmount, setNewAmount] = useState<number | ''>('');
    const [newMaxUses, setNewMaxUses] = useState<number | ''>('');
    const [newExpiry, setNewExpiry] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPromoCodes();
            setPromoCodes(data);
        } catch (error: any) {
            console.error('Error fetching promo codes:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || !newAmount || !newMaxUses) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);
            await adminService.createPromoCode({
                code: newCode,
                amount: Number(newAmount),
                maxUses: Number(newMaxUses),
                expiryDate: newExpiry ? new Date(newExpiry).toISOString() : undefined
            });
            toast.success('Coupon created successfully');
            setShowModal(false);
            setNewCode('');
            setNewAmount('');
            setNewMaxUses('');
            setNewExpiry('');
            fetchPromoCodes();
        } catch (error: any) {
            console.error('Error creating promo code:', error);
            toast.error(error.response?.data?.message || 'Failed to create the coupon; the code may already be in use.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await adminService.togglePromoCodeStatus(id);
            toast.success('Coupon status changed');
            fetchPromoCodes();
        } catch (error: any) {
            toast.error('Failed to change coupon status');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await adminService.deletePromoCode(id);
            toast.success('Deleted successfully');
            fetchPromoCodes();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete the coupon');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TicketIcon className="w-8 h-8 text-primary-500" />
                        Coupons and Marketing
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Create and manage top-up codes for students. The monthly wallet cap per student is 100 EGP.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Coupon
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : promoCodes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                    <TicketIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-xl font-medium text-gray-500 dark:text-gray-400">No coupons yet</p>
                    <button onClick={() => setShowModal(true)} className="mt-4 btn btn-outline">Add Your First Coupon</button>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Value (EGP)</th>
                                    <th className="px-6 py-4">Uses</th>
                                    <th className="px-6 py-4">Expiry Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {promoCodes.map((code) => (
                                    <React.Fragment key={code.id}>
                                        <tr
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${expandedId === code.id ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                                            onClick={() => setExpandedId(expandedId === code.id ? null : code.id)}
                                        >
                                            <td className="px-6 py-4 font-mono font-bold text-primary-600">{code.code}</td>
                                            <td className="px-6 py-4 font-bold">{code.amount} EGP</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${code.currentUses >= code.maxUses ? 'bg-red-500' : 'bg-primary-500'}`}
                                                            style={{ width: `${Math.min((code.currentUses / code.maxUses) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{code.currentUses} / {code.maxUses}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {code.expiryDate ? (
                                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                                        <ClockIcon className="w-4 h-4" />
                                                        {new Date(code.expiryDate).toLocaleDateString('ar-EG')}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Open</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggle(code.id); }}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${code.isActive
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                >
                                                    {code.isActive ? 'Active' : 'Disabled'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (code.currentUses > 0) {
                                                            toast.error("Cannot delete a used code. You can disable it instead.");
                                                            return;
                                                        }
                                                        if (window.confirm('Are you sure you want to delete this coupon? This cannot be undone.')) {
                                                            handleDelete(code.id);
                                                        }
                                                    }}
                                                    title={code.currentUses > 0 ? "Cannot delete a used code" : "Delete code"}
                                                    className={`p-2 rounded-lg transition-colors ${code.currentUses > 0
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                        }`}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                                <div className={`transition-transform duration-200 ${expandedId === code.id ? 'rotate-180' : ''}`}>
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === code.id && (
                                            <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                                                            Usage History ({code.currentUses})
                                                        </h4>
                                                        {code.usages && code.usages.length > 0 ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {code.usages.map((usage: any) => (
                                                                    <div key={usage.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col gap-1 shadow-sm">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="font-bold text-gray-900 dark:text-white">{usage.userName}</span>
                                                                            <span className="text-primary-600 text-xs font-bold">+{usage.amountRedeemed} EGP</span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <ClockIcon className="w-3 h-3" />
                                                                            {new Date(usage.usedAt).toLocaleString('ar-EG')}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic py-2">Coupon not used yet</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold">Create New Coupon</h3>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Coupon Code (Latin letters)</label>
                                <input
                                    type="text"
                                    required
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                    placeholder="مثال: WELCOME20"
                                    className="input-field"
                                    style={{ direction: 'ltr' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Top-up Value (EGP)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="1000"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(Number(e.target.value))}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Uses</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newMaxUses}
                                        onChange={(e) => setNewMaxUses(Number(e.target.value))}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
                                <input
                                    type="date"
                                    value={newExpiry}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setNewExpiry(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary flex-1"
                                >
                                    {submitting ? 'Creating...' : 'Save and Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPromoCodes;
