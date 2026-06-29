import { useState, useEffect, Fragment } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import {
    EllipsisVerticalIcon,
    MagnifyingGlassIcon,
    ArchiveBoxIcon,
    PlayIcon,
    PauseIcon,
    EyeIcon,
    TrashIcon,
    PencilIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import type { AdminPackage, AdminPackageFilter, AdminPackageDetail } from '../../types/adminTypes';

// Status mapping
const STATUS_LABELS: Record<string, string> = {
    'Active': 'نشط',
    'Paused': 'متوقف مؤقتاً',
    'Archived': 'مؤرشف',
    'Default': 'غير محدد'
};

const STATUS_COLORS: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Paused': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'Archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Default': 'bg-gray-100 text-gray-800'
};

const AdminPackages = () => {
    const [packages, setPackages] = useState<AdminPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Filters & Pagination
    const [filters, setFilters] = useState<AdminPackageFilter>({
        page: 1,
        pageSize: 10,
        search: '',
        status: undefined
    });

    // Search Debouncing
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
        }, 500); // 500ms delay

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const [totalCount, setTotalCount] = useState(0);

    // Modals
    const [selectedPackage, setSelectedPackage] = useState<AdminPackageDetail | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Status Change Modal
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusAction, setStatusAction] = useState<{ id: number, status: number, label: string } | null>(null);
    const [statusReason, setStatusReason] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [packageToDelete, setPackageToDelete] = useState<{ id: number, name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, [filters]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const result = await adminService.getPackages(filters);
            setPackages(result.items);
            setTotalCount(result.totalCount);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل الباقات');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const details = await adminService.getPackageDetails(id);
            setSelectedPackage(details);
            setDetailsOpen(true);
        } catch (error) {
            toast.error('فشل تحميل التفاصيل');
        }
    };

    const handleStatusChange = async () => {
        if (!statusAction) return;

        // Validation
        if (!statusReason.trim() || statusReason.trim().length < 5) {
            toast.error('يرجى كتابة سبب واضح (5 أحرف على الأقل).');
            return;
        }

        setStatusLoading(true);
        try {
            // Optimistic UI Update (Locally update status for better UX)
            // Note: We need to map the numeric status back to string for local update display if needed, 
            // but fetching is safer. For now, we will wait for fetch, but loading state handles UX.

            await adminService.updatePackageStatus(statusAction.id, statusAction.status, statusReason);
            toast.success('تم تحديث حالة الباقة بنجاح');

            setShowStatusModal(false);
            setStatusReason('');
            setStatusAction(null);

            // Refresh
            fetchPackages();

            if (selectedPackage?.id === statusAction.id) {
                // Refresh details if open
                handleViewDetails(statusAction.id);
            }
        } catch (error) {
            toast.error('فشل تحديث الحالة');
        } finally {
            setStatusLoading(false);
        }
    };

    const confirmDelete = (pkg: AdminPackage) => {
        if (pkg.totalBookingsCount > 0) {
            toast.error('لا يمكن حذف باقة مرتبطة بحجوزات. استخدم خيار الأرشفة.');
            return;
        }
        setPackageToDelete({ id: pkg.id, name: pkg.name });
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!packageToDelete) return;

        setDeleteLoading(true);
        try {
            await adminService.deletePackage(packageToDelete.id);
            toast.success('تم حذف الباقة بنجاح');
            fetchPackages();
            setDetailsOpen(false);
            setShowDeleteModal(false);
            setPackageToDelete(null);
        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                toast.error('لا يمكن حذف باقة مرتبطة بحجوزات. يرجى أرشفتها بدلاً من ذلك.');
            } else {
                toast.error('فشل حذف الباقة');
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS['Default']}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الباقات</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        استعراض وإدارة جميع باقات المعلمين في المنصة
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث عن باقة أو معلم..."
                            className="w-full pr-10 pl-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                            value={filters.status || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value ? Number(e.target.value) : undefined, page: 1 }))}
                        >
                            <option value="">الكل</option>
                            <option value="1">نشط</option>
                            <option value="2">محجوب/مؤقت</option>
                            <option value="3">مؤرشف</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الباقة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المعلم</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">السعر</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحجوزات</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">جاري التحميل...</td>
                                </tr>
                            ) : packages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">لا توجد باقات لعرضها</td>
                                </tr>
                            ) : (
                                packages.map((pkg) => (
                                    <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{pkg.name}</div>
                                            <div className="text-xs text-gray-500">{pkg.sessionsCount} حصة</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-200">{pkg.teacherName}</div>
                                            <div className="text-xs text-gray-500">{pkg.teacherEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                            {pkg.price} {pkg.currency}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                            {pkg.totalBookingsCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={pkg.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <Menu.Button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </Menu.Button>
                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left divide-y divide-gray-100 dark:divide-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                        <div className="px-1 py-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleViewDetails(pkg.id)}
                                                                        className={`${active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-white'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                    >
                                                                        <EyeIcon className="mr-2 h-4 w-4 ml-2" />
                                                                        التفاصيل
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            {['Active', 'Paused'].includes(pkg.status) && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => navigate(`/admin/teachers/${pkg.teacherProfileId}/packages?edit=${pkg.id}`)}
                                                                            className={`${active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-white'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <PencilIcon className="mr-2 h-4 w-4 ml-2 text-blue-500" />
                                                                            تعديل الباقة
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                        </div>
                                                        <div className="px-1 py-1">
                                                            {pkg.status !== 'Active' && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => {
                                                                                setStatusAction({ id: pkg.id, status: 1, label: 'تفعيل' });
                                                                                setShowStatusModal(true);
                                                                            }}
                                                                            className={`${active ? 'bg-green-100 text-green-900' : 'text-gray-900 dark:text-white'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <PlayIcon className="mr-2 h-4 w-4 ml-2 text-green-500" />
                                                                            تفعيل
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                            {pkg.status === 'Active' && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => {
                                                                                setStatusAction({ id: pkg.id, status: 2, label: 'إيقاف مؤقت' });
                                                                                setShowStatusModal(true);
                                                                            }}
                                                                            className={`${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900 dark:text-white'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <PauseIcon className="mr-2 h-4 w-4 ml-2 text-amber-500" />
                                                                            إيقاف مؤقت
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                            {pkg.status !== 'Archived' && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => {
                                                                                setStatusAction({ id: pkg.id, status: 3, label: 'أرشفة' });
                                                                                setShowStatusModal(true);
                                                                            }}
                                                                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-900 dark:text-white'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <ArchiveBoxIcon className="mr-2 h-4 w-4 ml-2 text-gray-500" />
                                                                            أرشفة
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                        </div>
                                                        <div className="px-1 py-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        disabled={pkg.totalBookingsCount > 0}
                                                                        onClick={() => confirmDelete(pkg)}
                                                                        className={`
                                                                            ${active ? 'bg-red-100 text-red-900' : 'text-red-600'} 
                                                                            ${pkg.totalBookingsCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                                                            group flex w-full items-center rounded-md px-2 py-2 text-sm
                                                                        `}
                                                                    >
                                                                        <TrashIcon className="mr-2 h-4 w-4 ml-2" />
                                                                        {pkg.totalBookingsCount > 0 ? 'لا يمكن الحذف (نشط)' : 'حذف نهائي'}
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination (Improved) */}
            <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                    إجمالي {totalCount} باقة
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={filters.page <= 1}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                        السابق
                    </button>
                    <span>{filters.page}</span>
                    <button
                        disabled={filters.page * filters.pageSize >= totalCount}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                        التالي
                    </button>
                </div>
            </div>

            {/* Details Dialog */}
            <Transition appear show={detailsOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setDetailsOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-right align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center">
                                        <span>تفاصيل الباقة</span>
                                        <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-gray-500">
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </Dialog.Title>

                                    {selectedPackage && (
                                        <div className="mt-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                                    <span className="block text-xs text-gray-500">اسم الباقة</span>
                                                    <span className="font-medium dark:text-white">{selectedPackage.name}</span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                                    <span className="block text-xs text-gray-500">المعلم</span>
                                                    <span className="font-medium dark:text-white">{selectedPackage.teacherName}</span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                                    <span className="block text-xs text-gray-500">السعر</span>
                                                    <span className="font-medium dark:text-white">{selectedPackage.price} {selectedPackage.currency}</span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                                    <span className="block text-xs text-gray-500">حالة الباقة</span>
                                                    <StatusBadge status={selectedPackage.status} />
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-4">
                                                <h4 className="font-medium mb-3 dark:text-white">إحصائيات الاستخدام (Impact)</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedPackage.totalBookingsCount}</div>
                                                        <div className="text-xs text-gray-500">إجمالي الحجوزات</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{selectedPackage.pendingBookingsCount}</div>
                                                        <div className="text-xs text-gray-500">معلقة</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{selectedPackage.completedBookingsCount}</div>
                                                        <div className="text-xs text-gray-500">مكتملة</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{selectedPackage.upcomingSessionsCount}</div>
                                                        <div className="text-xs text-gray-500">حصص قادمة</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedPackage.adminNote && (
                                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                                    <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 mb-1">ملاحظات المشرفين</h4>
                                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">{selectedPackage.adminNote}</p>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-slate-700">
                                                {selectedPackage.canDelete ? (
                                                    <button
                                                        onClick={() => {
                                                            setDetailsOpen(false);
                                                            confirmDelete(selectedPackage as any); // Type assertion for shared structure
                                                        }}
                                                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium"
                                                    >
                                                        حذف نهائي (آمن)
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 self-center">
                                                        لا يمكن الحذف (يوجد حجوزات)
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setDetailsOpen(false)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                                >
                                                    إغلاق
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Status Change Modal */}
            <Transition appear show={showStatusModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !statusLoading && setShowStatusModal(false)}>
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-right align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                    تغيير حالة الباقة: {statusAction?.label}
                                </Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-3">يرجى ذكر سبب هذا التغيير (للسجلات):</p>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white"
                                        rows={3}
                                        value={statusReason}
                                        onChange={(e) => setStatusReason(e.target.value)}
                                        placeholder="سبب التغيير (5 أحرف على الأقل)..."
                                        disabled={statusLoading}
                                    />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowStatusModal(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
                                        disabled={statusLoading}
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleStatusChange}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                                        disabled={statusLoading || !statusReason.trim() || statusReason.trim().length < 5}
                                    >
                                        {statusLoading ? 'جاري التحديث...' : 'تأكيد'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Delete Confirmation Modal (New) */}
            <Transition appear show={showDeleteModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !deleteLoading && setShowDeleteModal(false)}>
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-right align-middle shadow-xl transition-all border border-red-100 dark:border-red-900">
                                <div className="flex items-center gap-3 text-red-600 mb-4">
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <ExclamationTriangleIcon className="h-6 w-6" />
                                    </div>
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6">
                                        تأكيد الحذف النهائي
                                    </Dialog.Title>
                                </div>

                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        هل أنت متأكد من رغبتك في حذف الباقة
                                        <span className="font-bold text-gray-900 dark:text-white mx-1">"{packageToDelete?.name}"</span>
                                        نهائياً؟
                                    </p>
                                    <p className="text-xs text-red-500 mt-2 font-medium">
                                        لا يمكن التراجع عن هذا الإجراء وسيتم فقدان جميع بيانات الباقة.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50"
                                        disabled={deleteLoading}
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </div>
    );
};

export default AdminPackages;
