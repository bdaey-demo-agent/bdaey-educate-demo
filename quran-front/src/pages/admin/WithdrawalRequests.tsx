import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
// @ts-ignore
import toast from 'react-hot-toast';
import api from '../../services/api';
// import { translateStatus, getStatusColor } from '../../utils/statusTranslations';

interface WithdrawalRequest {
    id: number;
    teacherId: string;
    teacherName: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    paymentMethod: string;
    paymentDetailsJson: string;
    requestedAt: string;
    decidedAt?: string;
    rejectionReason?: string;
    adminName?: string;
}

const WithdrawalRequests: React.FC = () => {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

    // Action State
    const [actionNote, setActionNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showActionModal, setShowActionModal] = useState<'Approve' | 'Reject' | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const response = await api.get('/admin/withdrawals', { params });
            setRequests(response.data.items || []);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const handleAction = async () => {
        if (!selectedRequest || !showActionModal) return;

        if (showActionModal === 'Reject' && !actionNote) {
            toast.error('Please provide a decline reason');
            return;
        }

        setIsProcessing(true);
        try {
            const endpoint = showActionModal === 'Approve' ? 'approve' : 'reject';
            const body = showActionModal === 'Reject' ? { reason: actionNote } : {};

            await api.post(`/admin/withdrawals/${selectedRequest.id}/${endpoint}`, body);

            toast.success(`Request ${showActionModal === 'Approve' ? 'approved' : 'declined'} successfully`);
            fetchRequests();
            setShowActionModal(null);
            setSelectedRequest(null);
            setActionNote('');
        } catch (error) {
            toast.error('An error occurred while processing');
        } finally {
            setIsProcessing(false);
        }
    };

    const parseDetails = (json: string) => {
        try {
            const details = JSON.parse(json);
            return (
                <div className="text-sm space-y-1">
                    {Object.entries(details).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                            <span className="font-medium text-gray-500">{key}:</span>
                            <span className="text-gray-900 dark:text-gray-300">{value as string}</span>
                        </div>
                    ))}
                </div>
            );
        } catch {
            return <span className="text-gray-500">Invalid details</span>;
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Requests</h1>

                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-gray-500" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-field py-1 px-3 text-sm"
                    >
                        <option value="">All</option>
                        <option value="0">Pending</option>
                        <option value="1">Approved</option>
                        <option value="2">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Teacher</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Method</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No withdrawal requests</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{req.teacherName}</div>
                                            {/* <div className="text-xs text-gray-500">ID: {req.teacherId}</div> */}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-primary-green">
                                            {req.amount} EGP
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900">
                                                {req.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(req.requestedAt).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'Pending' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedRequest(req); setShowActionModal('Approve'); }}
                                                        className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                                                        title="Approve"
                                                    >
                                                        <CheckCircleIcon className="h-6 w-6" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRequest(req); setShowActionModal('Reject'); }}
                                                        className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                                                        title="Decline"
                                                    >
                                                        <XCircleIcon className="h-6 w-6" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    Handled by {req.adminName || 'Admin'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
                        <h3 className={`text-lg font-bold ${showActionModal === 'Approve' ? 'text-green-600' : 'text-red-600'}`}>
                            {showActionModal === 'Approve' ? 'Confirm Withdrawal Approval' : 'Decline Withdrawal Request'}
                        </h3>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Amount:</span>
                                <span className="font-bold">{selectedRequest.amount} EGP</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                                <p className="text-sm font-medium mb-1">Transfer details:</p>
                                {parseDetails(selectedRequest.paymentDetailsJson)}
                            </div>
                        </div>

                        {showActionModal === 'Reject' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Decline Reason (required)</label>
                                <textarea
                                    className="input-field w-full h-24"
                                    value={actionNote}
                                    onChange={(e) => setActionNote(e.target.value)}
                                    placeholder="Type the decline reason for the teacher..."
                                ></textarea>
                            </div>
                        )}

                        {showActionModal === 'Approve' && (
                            <p className="text-sm text-gray-500">
                                On approval, the amount is permanently deducted from the teacher's balance. Make sure you have made the actual transfer (outside the system) before or after confirming here, per your workflow.
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setShowActionModal(null); setActionNote(''); }}
                                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={isProcessing}
                                className={`flex-1 py-2 rounded-lg text-white font-medium ${showActionModal === 'Approve'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    } disabled:opacity-50`}
                            >
                                {isProcessing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalRequests;
