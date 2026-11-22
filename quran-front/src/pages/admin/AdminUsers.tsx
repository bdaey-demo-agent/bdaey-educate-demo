import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { type UnifiedUser } from '../../types/adminTypes';
import { toast } from 'react-hot-toast';import { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import {
    EllipsisVerticalIcon,
    NoSymbolIcon,
    EnvelopeIcon,
    KeyIcon,
    TrashIcon,
    ArrowRightEndOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UnifiedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('All');

    // Block Modal
    const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
    const [blockReason, setBlockReason] = useState('');

    // Delete Modal State
    const [deleteUser, setDeleteUser] = useState<UnifiedUser | null>(null);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1); // Step 1: warning, Step 2: type email
    const [deleteEmailInput, setDeleteEmailInput] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

    // Reset Password Modal
    const [resetPasswordUser, setResetPasswordUser] = useState<UnifiedUser | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [role]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAllUsers(role === 'All' ? undefined : role, search);
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers();
    };

    const handleBlockToggle = async () => {
        if (!selectedUser) return;
        try {
            await adminService.blockUser(selectedUser.id, !selectedUser.isBlocked, blockReason);
            toast.success(`User ${!selectedUser.isBlocked ? 'blocked' : 'unblocked'} successfully`);
            setSelectedUser(null);
            setBlockReason('');
            loadUsers();
        } catch (error: any) {
            console.error('Block Toggle Error:', error);
            const msg = error.response?.data?.message || 
                        (typeof error.response?.data === 'string' ? error.response.data : null) || 
                        error.message ||
                        'Failed to update user status (connection error)';
            toast.error(msg);
        }
    };

    const openDeleteModal = (user: UnifiedUser) => {
        setDeleteUser(user);
        setDeleteStep(1);
        setDeleteEmailInput('');
        setDeleteError('');
    };

    const closeDeleteModal = () => {
        setDeleteUser(null);
        setDeleteStep(1);
        setDeleteEmailInput('');
        setDeleteError('');
    };

    const handleDeleteUser = async () => {
        if (!deleteUser) return;
        if (deleteEmailInput.trim().toLowerCase() !== deleteUser.email.toLowerCase()) {
            setDeleteError('Email does not match. Please type it exactly.');
            return;
        }
        setIsDeleting(true);
        setDeleteError('');
        try {
            await adminService.deleteUser(deleteUser.id);
            toast.success('Account permanently deleted.');
            closeDeleteModal();
            loadUsers();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to delete the account. Please try again later.';
            setDeleteError(msg);
            // If it's an active account error, stay on step 1 to show error prominently
            setDeleteStep(1);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleResendVerification = async (user: UnifiedUser) => {
        setResendingEmailId(user.id);
        try {
            await adminService.resendVerificationEmail(user.id);
            toast.success('Activation email sent');
            loadUsers();
        } catch (error) {
            toast.error('Failed to send the activation email');
        } finally {
            setResendingEmailId(null);
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser || !newPassword) return;
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setIsResetting(true);
        try {
            await adminService.resetUserPassword(resetPasswordUser.id, newPassword);
            toast.success('Password changed successfully');
            setResetPasswordUser(null);
            setNewPassword('');
        } catch (error: any) {
            const msg = error.response?.data || error.message || 'Failed to change the password';
            toast.error(msg);
        } finally {
            setIsResetting(false);
        }
    };

    const handleImpersonate = async (user: UnifiedUser) => {
        try {
            toast.loading('Signing in...', { id: 'impersonate' });
            const data = await adminService.impersonateUser(user.id);
            login(data.token, data);
            toast.success(`Signed in as ${user.fullName}`, { id: 'impersonate' });
            
            if (data.role === 'Teacher') {
                navigate('/teacher');
            } else if (data.role === 'Student') {
                navigate('/student');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (error: any) {
            const msg = error.response?.data || error.message || 'Sign-in failed';
            toast.error(msg, { id: 'impersonate' });
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Teacher': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'Student': return 'Student';
            case 'Teacher': return 'Teacher';
            case 'Admin': return 'Admin';
            default: return role;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Directory</h2>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 border border-gray-100 dark:border-slate-700">
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="All">All Users</option>
                    <option value="Student">Students</option>
                    <option value="Teacher">Teachers</option>
                    <option value="Admin">Admins</option>
                </select>
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-md">
                        Search
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email Verified</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">No users found.</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{u.fullName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(u.role)}`}>
                                            {getRoleLabel(u.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.phoneNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-1 inline-flex text-[10px] leading-4 font-semibold rounded-full w-fit ${u.emailConfirmed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {u.emailConfirmed ? 'Verified' : 'Unverified'}
                                            </span>
                                            {u.emailConfirmationSentAt && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    Sent: {new Date(u.emailConfirmationSentAt).toLocaleDateString('en-GB')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isBlocked ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
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
                                                                    onClick={() => setSelectedUser(u)}
                                                                    className={`${active ? (u.isBlocked ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600') : (u.isBlocked ? 'text-green-600' : 'text-red-600')} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <NoSymbolIcon className="ml-2 h-5 w-5" /> {u.isBlocked ? 'Unblock' : 'Block'}
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        {!u.emailConfirmed && (
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleResendVerification(u)}
                                                                        disabled={resendingEmailId === u.id}
                                                                        className={`${active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm disabled:opacity-50`}
                                                                    >
                                                                        <EnvelopeIcon className="ml-2 h-5 w-5" /> {resendingEmailId === u.id ? 'Sending...' : 'Send Activation'}
                                                                    </button>
                                                                )}
                                                            </MenuItem>
                                                        )}
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => setResetPasswordUser(u)}
                                                                    className={`${active ? 'bg-blue-50 text-blue-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <KeyIcon className="ml-2 h-5 w-5" /> Password
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleImpersonate(u)}
                                                                    disabled={u.isBlocked}
                                                                    className={`${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-indigo-600 dark:text-indigo-400'} group flex w-full items-center rounded-lg px-2 py-2 text-sm disabled:opacity-50`}
                                                                >
                                                                    <ArrowRightEndOnRectangleIcon className="ml-2 h-5 w-5" /> Sign In As
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => openDeleteModal(u)}
                                                                    className={`${active ? 'bg-red-50 text-red-600' : 'text-red-600'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <TrashIcon className="ml-2 h-5 w-5" /> Delete Permanently
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
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Block Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-700 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                        </h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-300">
                            Are you sure you want to {selectedUser.isBlocked ? 'unblock' : 'block'} <b>{selectedUser.fullName}</b>?
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                            <input
                                type="text"
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                placeholder={`Why are you ${selectedUser.isBlocked ? 'unblocking' : 'blocking'} this user?`}
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlockToggle}
                                className={`px-4 py-2 text-white rounded-lg shadow-md transition-colors ${selectedUser.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 border border-red-200 dark:border-red-900/50 shadow-2xl">
                        
                        {/* Step 1: First warning */}
                        {deleteStep === 1 && (
                            <>
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Permanent Account Deletion</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone</p>
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                                        You are about to delete the account of: <span className="font-bold">{deleteUser.fullName}</span>
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-400">All their data will be permanently deleted, including:</p>
                                    <ul className="text-sm text-red-600 dark:text-red-400 mt-1 list-disc list-inside space-y-0.5">
                                        <li>Conversations and messages</li>
                                        <li>Booking history and completed sessions</li>
                                        <li>Wallet data and transactions</li>
                                        <li>All personal data</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-sm text-amber-700 dark:text-amber-300">
                                    ⚠️ Deletion will fail if the account has a balance or active bookings. In that case, blocking is recommended instead.
                                </div>

                                {deleteError && (
                                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 mb-4 text-sm text-red-700 dark:text-red-400 font-medium">
                                        {deleteError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={closeDeleteModal}
                                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { setDeleteStep(2); setDeleteError(''); }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors"
                                    >
                                        Yes, delete it
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 2: Type email to confirm */}
                        {deleteStep === 2 && (
                            <>
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <span className="text-red-600 dark:text-red-400 text-xl">🗑️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Permanent Deletion</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Final step before deletion</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    To confirm, type the user's email exactly:
                                </p>
                                <p className="text-sm font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded mb-3 text-center select-all">
                                    {deleteUser.email}
                                </p>
                                <input
                                    type="email"
                                    value={deleteEmailInput}
                                    onChange={(e) => { setDeleteEmailInput(e.target.value); setDeleteError(''); }}
                                    placeholder="Type the email here..."
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-400 focus:border-transparent mb-3"
                                    dir="ltr"
                                />

                                {deleteError && (
                                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 mb-3 text-sm text-red-700 dark:text-red-400">
                                        {deleteError}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={() => setDeleteStep(1)}
                                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleDeleteUser}
                                        disabled={isDeleting || deleteEmailInput.trim().toLowerCase() !== deleteUser.email.toLowerCase()}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/50 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-colors"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Reset Password Modal */}
            {resetPasswordUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 border border-gray-200 dark:border-slate-700 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
                            <span className="text-2xl">🔐</span>
                            <h3 className="text-lg font-bold">Set a New Password</h3>
                        </div>
                        
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                            You are about to change the password for: <br/>
                            <span className="font-bold text-gray-900 dark:text-white">{resetPasswordUser.fullName}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="At least 6 characters..."
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => { setResetPasswordUser(null); setNewPassword(''); }}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={isResetting || newPassword.length < 6}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/50 text-white rounded-lg shadow-md transition-colors font-medium"
                                >
                                    {isResetting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
