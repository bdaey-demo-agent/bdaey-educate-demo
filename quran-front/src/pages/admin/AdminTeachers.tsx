import React, { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAudioPlayer from '../../components/common/CustomAudioPlayer';
import Modal from '../../components/common/Modal';
import adminService from '../../services/adminService';
import { type AdminTeacher } from '../../types/adminTypes';
import { getFileUrl } from '../../utils/mediaUtils';
import packagesService from '../../services/packagesService';
import walletService from '../../services/walletService';
import { toast } from 'react-hot-toast';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    CheckCircleIcon,
    CurrencyDollarIcon,
    ArchiveBoxIcon,
    NoSymbolIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AdminTeachers: React.FC = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

    // Edit State
    const [editingTeacher, setEditingTeacher] = useState<AdminTeacher | null>(null);
    const [editCommissionRate, setEditCommissionRate] = useState<string>('');
    const [globalCommission, setGlobalCommission] = useState<number>(15);
    const [editPenaltyAmount, setEditPenaltyAmount] = useState<string>('');
    const [modalMode, setModalMode] = useState<'details' | 'commission' | 'penalty' | 'packages' | 'wallet' | null>(null);
    
    // Scheduled Commission States
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleDuration, setScheduleDuration] = useState<string>('1');
    const [scheduleUnit, setScheduleUnit] = useState<'Days' | 'Months'>('Days');

    const [teacherPackages, setTeacherPackages] = useState<any[]>([]);
    const [viewingWallet, setViewingWallet] = useState<{ userName: string, data: any } | null>(null);
    const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

    useEffect(() => {
        loadTeachers();
        loadGlobalSettings();
    }, []);

    const loadGlobalSettings = async () => {
        try {
            const rate = await adminService.getGlobalCommission();
            setGlobalCommission(rate);
        } catch (error) {
            console.error("Failed to load global settings", error);
        }
    };

    const loadTeachers = async () => {
        try {
            const data = await adminService.getTeachers();
            setTeachers(data);
        } catch (error) {
            toast.error('فشل في تحميل المعلمين');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        // Will use ConfirmModal later, for now we will rely on a toast or skip confirm
        // To avoid blocking, just process it (Admin action)
        try {
            await adminService.approveTeacher(id);
            toast.success('تم قبول المعلم');
            loadTeachers();
        } catch (error) {
            toast.error('فشل القبول');
        }
    };

    const handleBlockUser = async (userId: string, isBlocked: boolean) => {
        try {
            await adminService.toggleBlockUser(userId, !isBlocked, 'Administrative Action');
            setTeachers(teachers.map(t => t.userId === userId ? { ...t, isBlocked: !isBlocked } : t));
            toast.success(isBlocked ? 'تم فك الحظر' : 'تم حظر المستخدم');
        } catch (error: any) {
            console.error('Block Toggle Error:', error);
            const msg = error.response?.data?.message || 
                        (typeof error.response?.data === 'string' ? error.response.data : null) || 
                        error.message ||
                        'فشل تغيير حالة الحظر (خطأ في الاتصال)';
            toast.error(msg);
        }
    };

    const handleViewWallet = async (userId: string, userName: string) => {
        try {
            const walletData = await walletService.getUserWallet(userId);
            setViewingWallet({ userName, data: walletData });
            setModalMode('wallet');
            setEditingTeacher({ name: userName } as any);
        } catch (error) {
            toast.error('فشل عرض المحفظة');
        }
    };

    const handleUpdateTeacher = async () => {
        if (!editingTeacher) return;
        try {
            const rate = editCommissionRate === '' ? null : parseFloat(editCommissionRate);
            
            if (isScheduled) {
                const duration = parseInt(scheduleDuration);
                if (isNaN(duration) || duration <= 0) {
                    toast.error('يرجى إدخال مدة صحيحة');
                    return;
                }
                await adminService.updateTeacherCommission(editingTeacher.id, rate, duration, scheduleUnit);
            } else {
                await adminService.updateTeacherCommission(editingTeacher.id, rate);
            }

            toast.success('تم تحديث العمولة');
            setEditingTeacher(null);
            setModalMode(null);
            loadTeachers();
        } catch (error) {
            toast.error('فشل التحديث');
        }
    };

    const handleUpdateTeacherPenalty = async () => {
        if (!editingTeacher) return;
        try {
            const amount = editPenaltyAmount === '' ? null : parseFloat(editPenaltyAmount);
            await adminService.updateTeacherDeletionPenalty(editingTeacher.id, amount);
            toast.success('تم تحديث الغرامة');
            setEditingTeacher(null);
            loadTeachers();
        } catch (error) {
            toast.error('فشل التحديث');
        }
    };

    const handleLoadPackages = async (teacherId: number) => {
        try {
            const packages = await packagesService.getTeacherPackages(teacherId);
            setTeacherPackages(packages);
            setModalMode('packages');
        } catch (error) {
            toast.error('فشل تحميل الباقات');
        }
    };

    const handleDeletePackage = async (packageId: number) => {
        try {
            await packagesService.deletePackage(packageId, false);
            toast.success('تم حذف الباقة');
            if (editingTeacher) handleLoadPackages(editingTeacher.id);
        } catch (error) {
            toast.error('فشل الحذف');
        }
    };

    if (loading) return <div className="text-center py-8 dark:text-white">جاري التحميل...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">المعلمين</h2>
            
            <div className="flex border-b border-gray-200 dark:border-slate-700">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    الكل ({teachers.length})
                </button>
                <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === 'approved' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    المقبولين ({teachers.filter(t => t.isApproved || t.status === 'Approved').length})
                </button>
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${statusFilter === 'pending' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                    قيد الانتظار ({teachers.filter(t => !t.isApproved && t.status !== 'Approved').length})
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <input
                    type="text"
                    placeholder="بحث عن معلم..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button 
                    onClick={async () => {
                        try {
                            const res = await adminService.fixSubmissionStatuses();
                            toast.success(`تم تحديث ${res.count} معلم`);
                            loadTeachers();
                        } catch (e) {
                            toast.error('فشل تحديث البيانات');
                        }
                    }}
                    className="mt-2 md:mt-0 md:mr-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                    تحديث حالة إرسال البيانات للمعلمين القدامى
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الاسم / البريد</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحالة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">العمولة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">تاريخ الانضمام</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {teachers
                                .filter(t => {
                                    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                                        t.email.toLowerCase().includes(search.toLowerCase()) ||
                                        (t.phoneNumber && t.phoneNumber.includes(search));
                                    
                                    const isApproved = t.isApproved || t.status === 'Approved';
                                    const matchesStatus = statusFilter === 'all' || 
                                        (statusFilter === 'approved' && isApproved) || 
                                        (statusFilter === 'pending' && !isApproved);
                                    
                                    return matchesSearch && matchesStatus;
                                })
                                .map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            {teacher.isBlocked && <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">محظور</span>}
                                            {teacher.isApproved || teacher.status === 'Approved' ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">مقبول</span>
                                            ) : teacher.status === 'Rejected' ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">مرفوض</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full">قيد الانتظار</span>
                                            )}
                                            {teacher.isDataSubmitted ? (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">بعت البيانات</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">لم يرسل البيانات</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                                        <div className="flex flex-col">
                                            {teacher.scheduledCommissionRate !== undefined && teacher.scheduledCommissionUntil && new Date(teacher.scheduledCommissionUntil) > new Date() ? (
                                                <>
                                                    <span className="text-amber-600 dark:text-amber-400">{teacher.scheduledCommissionRate}% (مؤقت)</span>
                                                    <span className="text-[10px] text-gray-400 font-normal">ينتهي: {new Date(teacher.scheduledCommissionUntil).toLocaleDateString('ar-EG')}</span>
                                                </>
                                            ) : (
                                                teacher.commissionRate !== null && teacher.commissionRate !== undefined ? `${teacher.commissionRate}%` : <span className="text-gray-400 dark:text-gray-500 font-normal">افتراضي</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(teacher.createdAt).toLocaleDateString('ar-EG')}
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
                                                                    onClick={() => {
                                                                        setEditingTeacher(teacher);
                                                                        setModalMode('details');
                                                                    }}
                                                                    className={`${active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <EyeIcon className="ml-2 h-5 w-5" /> التفاصيل
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        {!teacher.isApproved && (
                                                            <MenuItem>
                                                                {({ active }) => (
                                                                    <button
                                                                        onClick={() => handleApprove(teacher.id)}
                                                                        className={`${active ? 'bg-green-50 text-green-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                    >
                                                                        <CheckCircleIcon className="ml-2 h-5 w-5" /> قبول
                                                                    </button>
                                                                )}
                                                            </MenuItem>
                                                        )}
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleViewWallet(teacher.userId, teacher.name)}
                                                                    className={`${active ? 'bg-green-50 text-green-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <CurrencyDollarIcon className="ml-2 h-5 w-5" /> المحفظة
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTeacher(teacher);
                                                                        setModalMode('commission');
                                                                        setEditCommissionRate(teacher.commissionRate?.toString() || '');
                                                                        setIsScheduled(false);
                                                                    }}
                                                                    className={`${active ? 'bg-blue-50 text-blue-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <CurrencyDollarIcon className="ml-2 h-5 w-5" /> تعديل العمولة
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTeacher(teacher);
                                                                        setModalMode('penalty');
                                                                        setEditPenaltyAmount(teacher.packageDeletionPenalty?.toString() || '');
                                                                    }}
                                                                    className={`${active ? 'bg-red-50 text-red-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <ExclamationTriangleIcon className="ml-2 h-5 w-5" /> تعديل الغرامة
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        navigate(`/admin/teachers/${teacher.id}/packages`);
                                                                    }}
                                                                    className={`${active ? 'bg-purple-50 text-purple-600' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <ArchiveBoxIcon className="ml-2 h-5 w-5" /> إدارة الباقات
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    </div>
                                                    <div className="p-1">
                                                        <MenuItem>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleBlockUser(teacher.userId, teacher.isBlocked)}
                                                                    className={`${active ? 'bg-red-50 text-red-600' : 'text-red-600'} group flex w-full items-center rounded-lg px-2 py-2 text-sm`}
                                                                >
                                                                    <NoSymbolIcon className="ml-2 h-5 w-5" /> {teacher.isBlocked ? 'فك الحظر' : 'حظر'}
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

            {/* Modals */}
            {(editingTeacher && modalMode) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modalMode === 'commission' && 'تعديل العمولة'}
                                {modalMode === 'penalty' && 'تعديل غرامة الحذف'}
                                {modalMode === 'packages' && 'باقات المعلم'}
                                {modalMode === 'wallet' && 'محفظة المعلم'}
                                {modalMode === 'details' && 'تفاصيل المعلم'}
                            </h3>
                            <button onClick={() => { setEditingTeacher(null); setModalMode(null); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">&times;</button>
                        </div>

                        {modalMode === 'commission' && (
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">نسبة العمولة (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={editCommissionRate}
                                        onChange={e => setEditCommissionRate(e.target.value)}
                                        placeholder={`الافتراضي (${globalCommission}%)`}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    />
                                    {editCommissionRate === '' && (
                                        <div className="absolute left-3 top-2.5 text-gray-400 text-sm">افتراضي</div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    اترك الحقل فارغاً أو أدخل {globalCommission} لاستخدام عمولة المنصة الافتراضية.
                                </p>

                                <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={isScheduled}
                                            onChange={e => setIsScheduled(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">جدولة التغيير (تغيير مؤقت)</span>
                                    </label>

                                    {isScheduled && (
                                        <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                            <div>
                                                <label className="block text-xs mb-1 text-gray-500">المدة</label>
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    value={scheduleDuration}
                                                    onChange={e => setScheduleDuration(e.target.value)}
                                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs mb-1 text-gray-500">الوحدة</label>
                                                <select 
                                                    value={scheduleUnit}
                                                    onChange={e => setScheduleUnit(e.target.value as any)}
                                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-700 dark:text-white"
                                                >
                                                    <option value="Days">أيام</option>
                                                    <option value="Months">شهور</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center mt-6">
                                    <button 
                                        onClick={() => {
                                            setEditCommissionRate('');
                                            setIsScheduled(false);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                                    >
                                        إعادة إلى الافتراضي
                                    </button>
                                    <div className="flex gap-3">
                                        <button onClick={() => setModalMode(null)} className="px-4 py-2 border rounded-lg dark:text-white dark:border-slate-600 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700">إلغاء</button>
                                        <button onClick={handleUpdateTeacher} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-bold">حفظ</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalMode === 'penalty' && (
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">قيمة الغرامة</label>
                                <input
                                    type="number"
                                    value={editPenaltyAmount}
                                    onChange={e => setEditPenaltyAmount(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                />
                                <div className="flex justify-end gap-3 mt-4">
                                    <button onClick={() => setModalMode(null)} className="px-4 py-2 border rounded-lg dark:text-white dark:border-slate-600">إلغاء</button>
                                    <button onClick={handleUpdateTeacherPenalty} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">حفظ</button>
                                </div>
                            </div>
                        )}

                        {modalMode === 'details' && (
                            <div className="space-y-6 text-gray-900 dark:text-white">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">الاسم الكامل</p>
                                        <p className="font-semibold">{editingTeacher.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{editingTeacher.email}</p>
                                            {editingTeacher.isDataSubmitted ? (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded-full">بعت البيانات</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 text-[10px] font-bold rounded-full">لم يرسل البيانات</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                                        <p className="font-semibold text-left" dir="ltr">{editingTeacher.phoneNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ الميلاد</p>
                                        <p className="font-semibold">{editingTeacher.dateOfBirth ? new Date(editingTeacher.dateOfBirth).toLocaleDateString('ar-EG') : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهوية الوطنية</p>
                                        <p className="font-semibold">{editingTeacher.nationalId || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">العنوان / المسمى</p>
                                        <p className="font-semibold">{editingTeacher.title || '-'}</p>
                                    </div>
                                </div>

                                {/* Qualifications */}
                                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                                    <h4 className="font-bold mb-3 text-primary dark:text-gold-500">المؤهلات والخبرات</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">المؤهل العلمي</p>
                                            <p className="font-semibold">{editingTeacher.educationDegree || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">سنوات الخبرة</p>
                                            <p className="font-semibold">{editingTeacher.experienceYears || '0'} سنوات</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">حفاظ القرآن؟</p>
                                            <p className="font-semibold">{editingTeacher.isHafiz ? 'نعم' : 'لا'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">معي إجازة؟</p>
                                            <p className="font-semibold">{editingTeacher.hasIjaza ? 'نعم' : 'لا'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">نبذة عني</p>
                                        <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg text-sm leading-relaxed">
                                            {editingTeacher.bio || 'لا توجد نبذة.'}
                                        </p>
                                    </div>

                                    {/* Ijaza Details */}
                                    {editingTeacher.hasIjaza && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">نوع الإجازة</p>
                                                <p className="font-semibold text-sm">{editingTeacher.ijazaType || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">الجهة المانحة</p>
                                                <p className="font-semibold text-sm">{editingTeacher.ijazaIssuer || '-'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">التخصصات</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {editingTeacher.subjects && editingTeacher.subjects.length > 0 ? (
                                                    editingTeacher.subjects.map((sub, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs">
                                                            {sub}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">سعر البدء</p>
                                            <p className="font-semibold">{editingTeacher.priceStart ? `${editingTeacher.priceStart} EGP` : '-'}</p>
                                        </div>
                                    </div>

                                    {/* Audio Sample */}
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">تسجيل صوتي</p>
                                        {editingTeacher.audioSampleUrl ? (
                                            <div className="w-full">
                                                <CustomAudioPlayer src={getFileUrl(editingTeacher.audioSampleUrl)} className="w-full max-w-sm" />
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm italic">لا يوجد تسجيل صوتي.</p>
                                        )}
                                    </div>

                                    {/* Social Links */}
                                    {editingTeacher.socialLinks && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">روابط التواصل</p>
                                            <a href={editingTeacher.socialLinks} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                                                {editingTeacher.socialLinks}
                                            </a>
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 dark:border-slate-700 pt-4">
                                        <button
                                            onClick={() => {
                                                setModalMode('commission');
                                                setEditCommissionRate(editingTeacher.commissionRate?.toString() || '');
                                            }}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                        >
                                            <CurrencyDollarIcon className="h-4 w-4 inline ml-1" />
                                            تعديل العمولة
                                        </button>
                                        <button
                                            onClick={() => {
                                                setModalMode('penalty');
                                                setEditPenaltyAmount(editingTeacher.packageDeletionPenalty?.toString() || '');
                                            }}
                                            className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
                                        >
                                            <ExclamationTriangleIcon className="h-4 w-4 inline ml-1" />
                                            تعديل الغرامة
                                        </button>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                                    <h4 className="font-bold mb-3 text-primary dark:text-gold-500">المستندات المرفقة</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* National ID Image */}
                                        <div className="border dark:border-slate-700 rounded-lg p-2">
                                            <p className="text-xs text-gray-500 mb-2">صورة الهوية</p>
                                            {editingTeacher.nationalIdImageUrl ? (
                                                <button
                                                    onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.nationalIdImageUrl), title: 'صورة الهوية' })}
                                                    className="block relative group w-full"
                                                >
                                                    <img src={getFileUrl(editingTeacher.nationalIdImageUrl)} alt="National ID" className="w-full h-32 object-cover rounded-md"
                                                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'} />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                        <span className="text-white text-sm font-bold">عرض</span>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-gray-400 text-sm">لا يوجد مرفق</div>
                                            )}
                                        </div>

                                        {/* Qualification Certificate */}
                                        <div className="border dark:border-slate-700 rounded-lg p-2">
                                            <p className="text-xs text-gray-500 mb-2">شهادة المؤهل</p>
                                            {editingTeacher.qualificationCertificateUrl ? (
                                                <button
                                                    onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.qualificationCertificateUrl), title: 'شهادة المؤهل' })}
                                                    className="block relative group w-full"
                                                >
                                                    <img src={getFileUrl(editingTeacher.qualificationCertificateUrl)} alt="Qualification" className="w-full h-32 object-cover rounded-md"
                                                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'} />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                        <span className="text-white text-sm font-bold">عرض</span>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-gray-400 text-sm">لا يوجد مرفق</div>
                                            )}
                                        </div>

                                        {/* Ijaza Certificate */}
                                        {editingTeacher.hasIjaza && (
                                            <div className="border dark:border-slate-700 rounded-lg p-2">
                                                <p className="text-xs text-gray-500 mb-2">شهادة الإجازة</p>
                                                {editingTeacher.ijazaCertificateUrl ? (
                                                         <button
                                                            onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.ijazaCertificateUrl), title: 'شهادة الإجازة' })}
                                                            className="block relative group w-full"
                                                        >
                                                            <img src={getFileUrl(editingTeacher.ijazaCertificateUrl)} alt="Ijaza" className="w-full h-32 object-cover rounded-md"
                                                                onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'} />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                                <span className="text-white text-sm font-bold">عرض</span>
                                                            </div>
                                                        </button>
                                                ) : (
                                                    <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-gray-400 text-sm">لا يوجد مرفق</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Experience Certificate */}
                                        <div className="border dark:border-slate-700 rounded-lg p-2">
                                            <p className="text-xs text-gray-500 mb-2">شهادة الخبرة</p>
                                            {editingTeacher.experienceCertificateUrl ? (
                                                <button
                                                    onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.experienceCertificateUrl), title: 'شهادة الخبرة' })}
                                                    className="block relative group w-full"
                                                >
                                                    <img src={getFileUrl(editingTeacher.experienceCertificateUrl)} alt="Experience" className="w-full h-32 object-cover rounded-md"
                                                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=Error'} />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                        <span className="text-white text-sm font-bold">عرض</span>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-gray-400 text-sm">لا يوجد مرفق</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {modalMode === 'packages' && (
                            <div className="space-y-4">
                                {teacherPackages.map(p => (
                                    <div key={p.id} className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 py-3 last:border-0">
                                        <span className="text-gray-900 dark:text-white">{p.name} - {p.price} {p.currency}</span>
                                        <button onClick={() => handleDeletePackage(p.id)} className="text-red-600 hover:text-red-800 dark:hover:text-red-400">حذف</button>
                                    </div>
                                ))}
                                {teacherPackages.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد باقات.</p>}
                            </div>
                        )}

                        {modalMode === 'wallet' && viewingWallet && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الرصيد الكلي</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{viewingWallet.data.balance} {viewingWallet.data.currency}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الرصيد المتاح</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{viewingWallet.data.availableBalance || viewingWallet.data.balance} {viewingWallet.data.currency}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">آخر المعاملات</h4>
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
                                            <p className="text-center py-4 text-gray-500">لا توجد معاملات.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            <Modal
                isOpen={!!viewingDoc}
                onClose={() => setViewingDoc(null)}
                title={viewingDoc?.title}
                size="4xl"
            >
                {viewingDoc && (
                    <div className="flex flex-col items-center">
                        {viewingDoc.url.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                                src={viewingDoc.url}
                                className="w-full h-[70vh] rounded-lg border dark:border-gray-700"
                                title={viewingDoc.title}
                            />
                        ) : (
                            <img
                                src={viewingDoc.url}
                                alt={viewingDoc.title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border dark:border-gray-700"
                            />
                        )}
                        <div className="mt-4 flex justify-end w-full">
                            <a
                                href={viewingDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 font-medium flex items-center gap-2"
                            >
                                <span>فتح في نافذة مستقلة</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminTeachers;
