import { useEffect, useState, Fragment } from 'react';
import adminService from '../../services/adminService';
import { type AdminStudent } from '../../types/adminTypes';
import walletService from '../../services/walletService';
import { toast } from 'react-hot-toast';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import {
    EllipsisVerticalIcon,
    CurrencyDollarIcon,
    NoSymbolIcon
} from '@heroicons/react/24/outline';

const AdminStudents = () => {
    const [students, setStudents] = useState<AdminStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewingWallet, setViewingWallet] = useState<{ userName: string, data: any } | null>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const data = await adminService.getStudents();
            setStudents(data);
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId: string, isBlocked: boolean) => {
        try {
            await adminService.toggleBlockUser(userId, !isBlocked, 'Administrative Action');
            setStudents(students.map(s => s.id === userId ? { ...s, isBlocked: !isBlocked } : s));
            toast.success(isBlocked ? 'User unblocked' : 'User blocked');
        } catch (error: any) {
            console.error('Block Toggle Error:', error);
            const msg = error.response?.data?.message || 
                        (typeof error.response?.data === 'string' ? error.response.data : null) || 
                        error.message ||
                        'Failed to change block status (connection error)';
            toast.error(msg);
        }
    };

    const handleViewWallet = async (userId: string, userName: string) => {
        try {
            const walletData = await walletService.getUserWallet(userId);
            setViewingWallet({ userName, data: walletData });
        } catch (error) {
            toast.error('Failed to load wallet');
        }
    };

    if (loading) return <div className="text-center py-8 dark:text-white">Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Students</h2>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <input
                    type="text"
                    placeholder="Search for a student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Join Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {students.filter(s =>
                                s.fullName.toLowerCase().includes(search.toLowerCase()) ||
                                s.email.toLowerCase().includes(search.toLowerCase()) ||
                                (s.phoneNumber && s.phoneNumber.includes(search))
                            ).map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {student.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {student.phoneNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(student.createdAt).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4">
                                        {student.isBlocked && <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Blocked</span>}
                                        {!student.isBlocked && <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">Active</span>}
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <Menu as="div" className="relative inline-block text-left">
                                            <div>
                                                <MenuButton className="inline-flex justify-center rounded-lg bg-white dark:bg-slate-700 p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none border border-gray-200 dark:border-slate-600 shadow-sm">
                                                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                                                </MenuButton>
                                            </div>
                                            <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                            >
                                                <MenuItems className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-gray-100 dark:divide-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleViewWallet(student.id, student.fullName)}
                                                                    className={`${active ? 'bg-green-50 text-green-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <CurrencyDollarIcon className="mr-2 h-5 w-5" /> Wallet
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleBlockUser(student.id, student.isBlocked)}
                                                                    className={`${active ? 'bg-red-50 text-red-600' : 'text-red-600'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <NoSymbolIcon className="mr-2 h-5 w-5" /> {student.isBlocked ? 'Unblock' : 'Block'}
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                </MenuItems>
                                            </Transition>
                                        </Menu>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No students.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Wallet Modal */}
            {viewingWallet && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Wallet: {viewingWallet.userName}</h3>
                            <button onClick={() => setViewingWallet(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">&times;</button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{viewingWallet.data.balance} {viewingWallet.data.currency}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{viewingWallet.data.availableBalance || viewingWallet.data.balance} {viewingWallet.data.currency}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3">Recent Transactions</h4>
                                <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-slate-700 rounded-lg">
                                    {viewingWallet.data.transactions?.map((t: any) => (
                                        <div key={t.id} className="border-b border-gray-100 dark:border-slate-700 py-3 px-4 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-bold ${t.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} dir="ltr">
                                                    {t.amount} {viewingWallet.data.currency}
                                                </span>
                                                <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{t.description}</p>
                                        </div>
                                    ))}
                                    {(!viewingWallet.data.transactions || viewingWallet.data.transactions.length === 0) && (
                                        <p className="text-center py-4 text-gray-500">No transactions.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudents;
