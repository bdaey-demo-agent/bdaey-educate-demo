import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { type WithdrawalRequest } from '../../types/adminTypes';
import { toast } from 'react-hot-toast';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';

const AdminPayouts = () => {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'Pending' | 'History'>('Pending');

    // Process Modal
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
    const [processMode, setProcessMode] = useState<'Approve' | 'Reject'>('Approve');
    const [referenceCode, setReferenceCode] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            // Get all and filter locally for simplicity, or add status param
            const data = await adminService.getWithdrawals();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to load withdrawal requests');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProcess = (req: WithdrawalRequest) => {
        setSelectedRequest(req);
        setProcessMode('Approve'); // Default
        setReferenceCode('');
        setRejectionReason('');
        setNote('');
    };

    const handleProcess = async () => {
        if (!selectedRequest) return;
        try {
            await adminService.processWithdrawal(
                selectedRequest.id,
                processMode,
                note,
                referenceCode,
                rejectionReason
            );
            toast.success(`Request ${processMode === 'Approve' ? 'approved' : 'declined'} successfully`);
            setSelectedRequest(null);
            loadRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process the request');
        }
    };

    const filteredRequests = requests.filter(r =>
        tab === 'Pending' ? r.status === 'Pending' : r.status !== 'Pending'
    );

    if (loading) return <div className="text-center py-8 dark:text-white">Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Payout Management</h2>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700">
                <button
                    onClick={() => setTab('Pending')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${tab === 'Pending'
                        ? 'border-primary text-primary dark:border-gold-500 dark:text-gold-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                >
                    Pending Requests
                </button>
                <button
                    onClick={() => setTab('History')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${tab === 'History'
                        ? 'border-primary text-primary dark:border-gold-500 dark:text-gold-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                >
                    History
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teacher</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transfer Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Request Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                {tab === 'Pending' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredRequests.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">#{r.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.teacherName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">${r.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.paymentMethod}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 dir-ltr text-right">{r.paymentDetails}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(r.requestedAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(r.status)}`}>
                                            {translateStatus(r.status)}
                                        </span>
                                    </td>
                                    {tab === 'Pending' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenProcess(r)}
                                                className="text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                            >
                                                Process
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No requests in this list.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Process Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Process Withdrawal Request #{selectedRequest.id}</h3>

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setProcessMode('Approve')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${processMode === 'Approve'
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => setProcessMode('Reject')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${processMode === 'Reject'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                Decline
                            </button>
                        </div>

                        <div className="space-y-4">
                            {processMode === 'Approve' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Code (optional)</label>
                                    <input
                                        type="text"
                                        value={referenceCode}
                                        onChange={(e) => setReferenceCode(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                        placeholder="Bank or wallet transaction number"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Decline Reason</label>
                                    <input
                                        type="text"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                        placeholder="Why was the request declined?"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    rows={2}
                                    placeholder="Internal notes..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcess}
                                className={`px-4 py-2 text-white rounded-lg shadow-md transition-colors ${processMode === 'Approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                Confirm {processMode === 'Approve' ? 'Approval' : 'Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayouts;
