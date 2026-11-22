import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { type AdminBooking } from '../../types/adminTypes';
import { toast } from 'react-hot-toast';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';

const AdminBookings = () => {
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null); // Detail view
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Cancel Form
    const [cancelReason, setCancelReason] = useState('');
    const [refundMode, setRefundMode] = useState('Full');
    const [refundAmount, setRefundAmount] = useState<number>(0);
    const [adminNote, setAdminNote] = useState('');

    const [filterStatus, setFilterStatus] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadBookings();
        }, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [filterStatus, dateFrom, dateTo, search]);

    const loadBookings = async () => {
        try {
            const data = await adminService.getAllBookings({
                status: filterStatus,
                from: dateFrom,
                to: dateTo,
                search
            });
            setBookings(data);
        } catch (error) {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const data = await adminService.getBookingDetails(id);
            setSelectedBooking(data);
        } catch (error) {
            toast.error('Failed to load details');
        }
    };

    const handleCancel = async () => {
        if (!selectedBooking) return;
        try {
            await adminService.cancelBooking(selectedBooking.id, cancelReason, refundMode, refundAmount, adminNote);
            toast.success('Booking cancelled');
            setShowCancelModal(false);
            setSelectedBooking(null);
            loadBookings();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Cancellation failed');
        }
    };

    // Helper functions removed in favor of utils

    if (loading) return <div className="text-center py-8 dark:text-white">Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Booking Management</h2>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 border border-gray-100 dark:border-slate-700">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search student, teacher, package..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 dark:border-slate-600 rounded-lg p-2 w-full md:w-auto bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teacher</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Package</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {bookings.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">#{b.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{b.studentName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{b.teacherName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{b.packageName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">{b.totalPrice} {b.currency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(b.status)}`}>
                                            {translateStatus(b.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                        <button
                                            onClick={() => handleViewDetails(b.id)}
                                            className="text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No bookings match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-xl">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Booking Details #{selectedBooking.id}</h3>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Student</p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedBooking.student?.fullName}</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">{selectedBooking.student?.email}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Teacher</p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedBooking.teacher?.fullName}</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">{selectedBooking.teacher?.email}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                                    {translateStatus(selectedBooking.status)}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Price</p>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedBooking.totalPrice} {selectedBooking.currency}</p>
                            </div>
                        </div>

                        {/* Sessions List */}
                        <div className="mb-8">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>Sessions</span>
                                <span className="bg-gray-100 dark:bg-slate-700 text-xs px-2 py-1 rounded-full">{selectedBooking.sessions?.length || 0}</span>
                            </h4>
                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                {selectedBooking.sessions?.map((s: any, idx: number) => (
                                    <div key={s.id} className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700 last:border-b-0 bg-white dark:bg-slate-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400 text-sm">#{idx + 1}</span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200" dir="ltr">
                                                {new Date(s.scheduledAt).toLocaleString('en-GB')}
                                            </span>
                                        </div>
                                        <span className={`text-sm px-2 py-1 rounded ${getStatusColor(s.status)}`}>
                                            {translateStatus(s.status)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Close
                            </button>
                            {selectedBooking.status !== 'Cancelled' && selectedBooking.status !== 'Completed' && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Cancel Booking #{selectedBooking.id}</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cancellation Reason</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    rows={3}
                                    placeholder="Type the cancellation reason..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Refund Type</label>
                                <select
                                    value={refundMode}
                                    onChange={(e) => setRefundMode(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                    <option value="Full">Full refund</option>
                                    <option value="Partial">Partial refund</option>
                                    <option value="None">No refund</option>
                                </select>
                            </div>

                            {refundMode === 'Partial' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Refund Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                        />
                                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">EGP</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum: {selectedBooking.totalPrice}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes (optional)</label>
                                <input
                                    type="text"
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Internal admin notes only"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookings;
