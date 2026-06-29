import { useSearchParams } from 'react-router-dom';
import { getFileUrl } from '../../utils/mediaUtils';
import {
    ChartPieIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    CheckCircleIcon,
    ArchiveBoxIcon,
    NoSymbolIcon,
    ExclamationTriangleIcon,
    SignalIcon
} from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import React, { useState, useEffect, Fragment } from 'react';
import CustomAudioPlayer from '../../components/common/CustomAudioPlayer';
import Modal from '../../components/common/Modal';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const renderThumbnail = (url: string, title: string, onClick: () => void) => {
    const isPdf = url.toLowerCase().endsWith('.pdf');
    return (
        <button
            onClick={onClick}
            className="w-full relative group"
        >
            {isPdf ? (
                <div className="h-32 w-full flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-red-500 group-hover:bg-gray-100 transition-colors">
                    <DocumentTextIcon className="h-10 w-10 mb-1" />
                    <span className="text-[10px] font-medium text-gray-500 line-clamp-1 px-2">{title} (PDF)</span>
                </div>
            ) : (
                <img src={url} className="h-32 w-full object-cover rounded-lg border hover:opacity-90 transition-opacity" alt={title} />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors rounded-lg">
                <div className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                    <EyeIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                </div>
            </div>
        </button>
    );
};
import packagesService from '../../services/packagesService';
import adminService from '../../services/adminService';
import { type AdminStats, type AdminTeacher, type AdminStudent } from '../../types/adminTypes';
import walletService from '../../services/walletService';
import toast from 'react-hot-toast';
import MessagesTab from './tabs/MessagesTab';
import AdminBookings from './AdminBookings';
import AdminPayouts from './AdminPayouts';
import AdminUsers from './AdminUsers';
import AdminPromoCodes from './AdminPromoCodes';

const AdminDashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'overview' | 'teachers' | 'students' | 'messages' | 'bookings' | 'payouts' | 'users' | 'promo-codes') || 'overview';

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab });
    };
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
    const [students, setStudents] = useState<AdminStudent[]>([]);
    const [loading, setLoading] = useState(true);


    // Search State
    const [teacherSearch, setTeacherSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // Edit State
    const [editingTeacher, setEditingTeacher] = useState<AdminTeacher | null>(null);
    const [editCommissionRate, setEditCommissionRate] = useState<string>('');
    const [editPenaltyAmount, setEditPenaltyAmount] = useState<string>('');
    const [modalMode, setModalMode] = useState<'details' | 'commission' | 'penalty' | 'packages' | 'wallet' | null>(null); // Added 'wallet'
    const [viewingWallet, setViewingWallet] = useState<{ userName: string, data: any } | null>(null);
    const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

    // ... existing useEffects ...

    const handleViewWallet = async (userId: string, userName: string) => {
        try {
            const walletData = await walletService.getUserWallet(userId);
            setViewingWallet({ userName, data: walletData });
            setModalMode('wallet');
            setEditingTeacher({ name: userName } as any); // Hack to reuse existing modal structure or legitimate use
        } catch (error) {
            console.error(error);
            toast.error('فشل في جلب بيانات المحفظة');
        }
    };
    const [teacherPackages, setTeacherPackages] = useState<any[]>([]);
    // State to track if we are editing detailed info or just commission or penalty

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {

            const [statsData, teachersData, studentsData] = await Promise.all([
                adminService.getStats(),
                adminService.getTeachers(),
                adminService.getStudents()
            ]);
            setStats(statsData);
            setTeachers(teachersData);
            setStudents(studentsData);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };



    const handleUpdateTeacher = async () => {
        if (!editingTeacher) return;
        try {
            const rate = editCommissionRate === '' ? null : parseFloat(editCommissionRate);
            // @ts-ignore
            await adminService.updateTeacherCommission(editingTeacher.id, rate);
            toast.success('تم تحديث نسبة المعلم');
            setEditingTeacher(null);
            loadData(); // Reload list
        } catch (error) {
            toast.error('فشل التحديث');
        }
    };

    const handleUpdateTeacherPenalty = async () => {
        if (!editingTeacher) return;
        try {
            const amount = editPenaltyAmount === '' ? null : parseFloat(editPenaltyAmount);
            await adminService.updateTeacherDeletionPenalty(editingTeacher.id, amount);
            toast.success('تم تحديث غرامة المعلم');
            setEditingTeacher(null);
            loadData();
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
        // Custom confirmation with checkbox logic is handled via custom UI or just simple confirms for now.
        // User wants Admin to have choice. Let's use window.confirm but that doesn't capture checkbox.
        // Better: We can't put a checkbox in window.confirm.
        // We will default to NO penalty for Admin as requested ("If Admin deletes -> no penalty").
        // But to be safe, maybe ask? 
        // Simplest implementation for now: simple confirm, but pass applyPenalty=false by default for Admin?
        // User said: "If Admin deletes... NO PENALTY".
        // Use confirm dialog to ask specifically? 
        // "Cancel with Penalty?" vs "Cancel without Penalty?"
        // Browsers don't support 3 buttons.
        // Let's rely on the Modal UI I'm about to build or simple confirm.
        // I'll update the 'View Packages' section to have the checkbox inline or a smarter modal.
        // For now, let's hardcode applyPenalty=false as per user request "If Admin deletes... NO penalty".
        // Wait, user might want option.
        // I will add a small state `applyPenaltyToTeacher` in the package list next to Delete button? No.
        // I'll just change the confirm message to be explicit: "Deleting... Note: Penalty will NOT be applied."
        // Removed window.confirm. Admin actions bypass native confirms.
        try {
            await packagesService.deletePackage(packageId, false); // false = WAIVE PENALTY
            toast.success('تم حذف الباقة (تم إعفاء المعلم من الغرامة)');
            if (editingTeacher) handleLoadPackages(editingTeacher.id);
        } catch (error) {
            toast.error('فشل الحذف');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await adminService.approveTeacher(id);
            toast.success('تم قبول المعلم');
            loadData();
        } catch (error) {
            toast.error('فشل العملية');
        }
    };

    const handleBlockUser = async (userId: string, isBlocked: boolean) => {
        try {
            await adminService.toggleBlockUser(userId, !isBlocked);
            // Update both lists
            setTeachers(teachers.map(t => t.userId === userId ? { ...t, isBlocked: !isBlocked } : t));
            setStudents(students.map(s => s.id === userId ? { ...s, isBlocked: !isBlocked } : s));

            toast.success(isBlocked ? 'تم فك الحظر بنجاح' : 'تم حظر المستخدم بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء تغيير حالة الحظر');
        }
    };

    const handleClearCache = async () => {
        try {
            await adminService.clearManualCache();
            toast.success('تم مسح الذاكرة المؤقتة بنجاح (سيتم تحديث قائمة المعلمين العامة)');
        } catch (error) {
            toast.error('فشل مسح الذاكرة المؤقتة');
        }
    };

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">لوحة تحكم المشرف</h1>
                        <button
                            onClick={handleClearCache}
                            title="تفريغ الذاكرة المؤقتة لتحديث قائمة المعلمين العامة فوراً"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                            <SignalIcon className="h-4 w-4" />
                            تحديث القائمة العامة
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            نظرة عامة
                        </button>
                        <button
                            onClick={() => setActiveTab('teachers')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'teachers' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            المعلمون
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            الطلاب
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'messages' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            الرسائل
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            الحجوزات
                        </button>
                        <button
                            onClick={() => setActiveTab('payouts')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'payouts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            المدفوعات
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-lg ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            المستخدمين (شامل)
                        </button>
                        <button
                            onClick={() => setActiveTab('promo-codes')}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'promo-codes' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            الكوبونات
                        </button>
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                                    <UserGroupIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">إجمالي المستخدمين</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
                                    <SignalIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">المستخدمون النشطون الآن</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsersCount}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                                    <AcademicCapIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">المعلمون</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTeachers} ({stats.pendingTeachers} انتظار)</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                    <CurrencyDollarIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">الحجم الكلي للحجوزات</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVolume.toLocaleString()} EGP</h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                                    <ChartPieIcon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">الحجوزات</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings} ({stats.completedBookings} مكتمل)</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MESSAGES TAB */}
                {activeTab === 'messages' && <MessagesTab />}

                {/* NEW TABS */}
                {activeTab === 'bookings' && <AdminBookings />}
                {activeTab === 'payouts' && <AdminPayouts />}
                {activeTab === 'users' && <AdminUsers />}
                {activeTab === 'promo-codes' && <AdminPromoCodes />}

                {/* TEACHERS TAB */}
                {activeTab === 'teachers' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                            <input
                                type="text"
                                placeholder="🔍 بحث عن معلم (الاسم، البريد، الهاتف)..."
                                value={teacherSearch}
                                onChange={(e) => setTeacherSearch(e.target.value)}
                                className="w-full md:w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم / البريد</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة العمولة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانضمام</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {teachers.filter(t =>
                                        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                                        t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                                        (t.phoneNumber && t.phoneNumber.includes(teacherSearch))
                                    ).map((teacher) => (
                                        <tr key={teacher.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                                                <div className="text-sm text-gray-500">{teacher.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {teacher.isBlocked && (
                                                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full w-fit">محظور</span>
                                                    )}
                                                    {teacher.isApproved || teacher.status === 'Approved' ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full w-fit">معتمد</span>
                                                    ) : teacher.status === 'Rejected' ? (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full w-fit">مرفوض</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full w-fit">في الانتظار</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-blue-600">
                                                {teacher.commissionRate !== null ? `${teacher.commissionRate}%` : <span className="text-gray-400">افتراضي</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(teacher.createdAt).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <div>
                                                        <MenuButton className="inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                                                            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
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
                                                        <MenuItems anchor="bottom end" className="w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingTeacher(teacher);
                                                                                setModalMode('details');
                                                                            }}
                                                                            className={`${active ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'
                                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <EyeIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                            عرض التفاصيل
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                                {!teacher.isApproved && (
                                                                    <MenuItem>
                                                                        {({ active }) => (
                                                                            <button
                                                                                onClick={() => handleApprove(teacher.id)}
                                                                                className={`${active ? 'bg-green-50 dark:bg-gray-700 text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-200'
                                                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                            >
                                                                                <CheckCircleIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                                قبول المعلم
                                                                            </button>
                                                                        )}
                                                                    </MenuItem>
                                                                )}
                                                            </div>
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleViewWallet(teacher.userId, teacher.name)}
                                                                            className={`${active ? 'bg-primary-green/10 text-primary-green' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <CurrencyDollarIcon className="ml-2 h-5 w-5 text-gold-500" aria-hidden="true" />
                                                                            عرض المحفظة
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                            </div>
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingTeacher(teacher);
                                                                                setModalMode('commission');
                                                                                setEditCommissionRate(teacher.commissionRate?.toString() || '');
                                                                            }}
                                                                            className={`${active ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'
                                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <CurrencyDollarIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                            تعديل النسبة
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
                                                                            className={`${active ? 'bg-red-50 dark:bg-gray-700 text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-200'
                                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <ExclamationTriangleIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                            تعديل الغرامة
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                            </div>
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingTeacher(teacher);
                                                                                handleLoadPackages(teacher.id);
                                                                            }}
                                                                            className={`${active ? 'bg-purple-50 dark:bg-gray-700 text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-gray-200'
                                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <ArchiveBoxIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                            عرض الباقات
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                            </div>
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleBlockUser(teacher.userId, teacher.isBlocked)}
                                                                            className={`${active ? (teacher.isBlocked ? 'bg-green-50 dark:bg-gray-700 text-green-600' : 'bg-red-50 dark:bg-gray-700 text-red-600') : (teacher.isBlocked ? 'text-green-600' : 'text-red-600')
                                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <NoSymbolIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                            {teacher.isBlocked ? 'فك الحظر' : 'حظر المعلم'}
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
                )}

                {/* STUDENTS TAB */}
                {activeTab === 'students' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                            <input
                                type="text"
                                placeholder="🔍 بحث عن طالب (الاسم، البريد، الهاتف)..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full md:w-1/3 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الهاتف</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانضمام</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {student.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dir-ltr text-right">
                                                {student.phoneNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(student.createdAt).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <div>
                                                        <Menu.Button className="inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                                                            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden="true" />
                                                        </Menu.Button>
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
                                                        <MenuItems anchor="bottom end" className="w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleViewWallet(student.id, student.fullName)}
                                                                            className={`${active ? 'bg-primary-green/10 text-primary-green' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <CurrencyDollarIcon className="ml-2 h-5 w-5 text-gold-500" aria-hidden="true" />
                                                                            عرض المحفظة
                                                                        </button>
                                                                    )}
                                                                </MenuItem>
                                                            </div>
                                                            <div className="px-1 py-1">
                                                                <MenuItem>
                                                                    {({ active }) => (
                                                                        <button
                                                                            onClick={() => handleBlockUser(student.id, student.isBlocked)}
                                                                            className={`${active ? (student.isBlocked ? 'bg-green-50 dark:bg-gray-700 text-green-600' : 'bg-red-50 dark:bg-gray-700 text-red-600') : (student.isBlocked ? 'text-green-600' : 'text-red-600')
                                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                                        >
                                                                            <NoSymbolIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                                                                            {student.isBlocked ? 'فك الحظر' : 'حظر الطالب'}
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
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                لا يوجد طلاب مسجلين
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}



                {/* View/Edit Modals */}
                {(editingTeacher && modalMode) && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
                            {/* Check if we are in 'Edit Commission' mode or 'View Details' mode */}
                            {modalMode === 'commission' ? (
                                // Edit Commission Mode
                                <>
                                    <h3 className="text-lg font-bold mb-4">تعديل نسبة العمولة: {editingTeacher.name}</h3>
                                    <div className="mb-6">
                                        <label className="block text-sm mb-2">النسبة الخاصة (%) - اتركها فارغة لاستخدام الافتراضي</label>
                                        <input
                                            type="number"
                                            value={editCommissionRate}
                                            onChange={(e) => setEditCommissionRate(e.target.value)}
                                            placeholder="النسبة الافتراضية"
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => { setEditingTeacher(null); setModalMode(null); }}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={handleUpdateTeacher}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            حفظ التغييرات
                                        </button>
                                    </div>
                                </>
                            ) : modalMode === 'penalty' ? (
                                // Edit Penalty Mode
                                <>
                                    <h3 className="text-lg font-bold mb-4">تعديل غرامة الحذف: {editingTeacher.name}</h3>
                                    <div className="mb-6">
                                        <label className="block text-sm mb-2">غرامة الحذف الخاصة (وحدة) - اتركها فارغة لاستخدام الافتراضي</label>
                                        <input
                                            type="number"
                                            value={editPenaltyAmount}
                                            onChange={(e) => setEditPenaltyAmount(e.target.value)}
                                            placeholder="الافتراضي"
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">القيمة التي ستخصم عند حذف باقة نشطة.</p>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => { setEditingTeacher(null); setModalMode(null); }}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={handleUpdateTeacherPenalty}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            حفظ الغرامة
                                        </button>
                                    </div>
                                </>
                            ) : modalMode === 'wallet' && viewingWallet ? (
                                <>
                                    <h3 className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                                        محفظة: {viewingWallet.userName}
                                    </h3>

                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl text-center mb-6 border border-gray-100 dark:border-gray-600">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الرصيد الحالي</p>
                                        <div className="text-4xl font-bold text-primary-green flex items-center justify-center gap-1 font-heading">
                                            <span>{viewingWallet.data.balance.toLocaleString()}</span>
                                            <span className="text-lg">{viewingWallet.data.currency}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">آخر المعاملات</h4>
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                            {viewingWallet.data.transactions.length > 0 ? (
                                                viewingWallet.data.transactions.map((t: any) => (
                                                    <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-200">{t.description}</p>
                                                            <span className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</span>
                                                        </div>
                                                        <span className={`font-bold ${t.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                                            {t.type === 'Deposit' ? '+' : '-'}{t.amount} {viewingWallet.data.currency}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-gray-500 py-4">لا توجد معاملات سابقة</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button
                                            onClick={() => { setModalMode(null); setViewingWallet(null); }}
                                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition w-full"
                                        >
                                            إغلاق
                                        </button>
                                    </div>
                                </>
                            ) : modalMode === 'packages' ? (
                                // Packages Mode
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">باقات المعلم: {editingTeacher.name}</h3>
                                        <button
                                            onClick={() => { setEditingTeacher(null); setModalMode(null); }}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {teacherPackages.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">لا توجد باقات لهذا المعلم.</p>
                                    ) : (
                                        <div className="grid gap-4">
                                            {teacherPackages.map(pkg => (
                                                <div key={pkg.id} className="border dark:border-gray-700 rounded-lg p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{pkg.name}</h4>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                                                            {pkg.price} EGP - {pkg.sessionsCount} جلسات ({pkg.periodType})
                                                        </p>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {pkg.hasActiveBookings ?
                                                                <span className="text-green-600 font-medium">نشطة (بها حجوزات)</span> :
                                                                <span>لا توجد حجوزات نشطة</span>
                                                            }
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeletePackage(pkg.id)}
                                                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // View Details Mode
                                <div className="space-y-6 dir-rtl">
                                    <div className="flex justify-between items-start border-b pb-4 dark:border-gray-700">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingTeacher.name}</h3>
                                            <p className="text-gold-600 font-medium">{editingTeacher.title || 'العنوان الوظيفي غير محدد'}</p>
                                            {/* Debug Log */}
                                        </div>
                                        <div className="text-left">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${editingTeacher.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                editingTeacher.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {editingTeacher.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">معلومات الاتصال</h4>
                                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                <p><span className="font-medium">البريد:</span> {editingTeacher.email}</p>
                                                <p><span className="font-medium">الهاتف:</span> {editingTeacher.phoneNumber || 'غير متوفر'}</p>
                                                <p><span className="font-medium">الروابط:</span> {editingTeacher.socialLinks || 'لا يوجد'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">المؤهلات والخبرة</h4>
                                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                <p><span className="font-medium">المؤهل:</span> {(editingTeacher.educationDegree === 'bachelor' ? 'بكالوريوس' :
                                                    editingTeacher.educationDegree === 'master' ? 'ماجستير' :
                                                        editingTeacher.educationDegree === 'phd' ? 'دكتوراه' :
                                                            editingTeacher.educationDegree) || 'غير محدد'}</p>
                                                <p><span className="font-medium">الخبرة:</span> {editingTeacher.experienceYears || 'غير محدد'}</p>
                                                <p><span className="font-medium">حافظ:</span> {editingTeacher.isHafiz ? 'نعم' : 'لا'}</p>
                                                <p><span className="font-medium">إجازة:</span> {editingTeacher.hasIjaza ? `نعم (${editingTeacher.ijazaType})` : 'لا'}</p>
                                                <p><span className="font-medium">جهة الإجازة:</span> {editingTeacher.ijazaIssuer || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Documents Section */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">بيانات التحقق والهوية</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">الرقم القومي</p>
                                                <p className="text-gray-900 dark:text-white font-mono">{editingTeacher.nationalId || 'غير متوفر'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">تاريخ الميلاد</p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {editingTeacher.dateOfBirth ? new Date(editingTeacher.dateOfBirth).toLocaleDateString('ar-EG') : 'غير متوفر'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-2">صورة البطاقة</p>
                                                {editingTeacher.nationalIdImageUrl ? (
                                                    <div className="space-y-1">
                                                        {renderThumbnail(getFileUrl(editingTeacher.nationalIdImageUrl), 'صورة الهوية', () => setViewingDoc({ url: getFileUrl(editingTeacher.nationalIdImageUrl), title: 'صورة الهوية' }))}
                                                        <button
                                                            onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.nationalIdImageUrl), title: 'صورة الهوية' })}
                                                            className="text-xs text-blue-500 underline break-all block text-right w-full" dir="ltr"
                                                        >
                                                            {getFileUrl(editingTeacher.nationalIdImageUrl)}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-red-500 text-sm">لم يتم الرفع</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-2">المؤهل الدراسي</p>
                                                {editingTeacher.qualificationCertificateUrl ? (
                                                    <div className="space-y-1">
                                                        {renderThumbnail(getFileUrl(editingTeacher.qualificationCertificateUrl), 'صورة المؤهل', () => setViewingDoc({ url: getFileUrl(editingTeacher.qualificationCertificateUrl), title: 'شهادة المؤهل' }))}
                                                        <button
                                                            onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.qualificationCertificateUrl), title: 'شهادة المؤهل' })}
                                                            className="text-xs text-blue-500 underline break-all block text-right w-full" dir="ltr"
                                                        >
                                                            {getFileUrl(editingTeacher.qualificationCertificateUrl)}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">غير متوفر</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-2">شهادة الخبرة</p>
                                                {editingTeacher.experienceCertificateUrl ? (
                                                    <div className="space-y-1">
                                                        {renderThumbnail(getFileUrl(editingTeacher.experienceCertificateUrl), 'شهادة الخبرة', () => setViewingDoc({ url: getFileUrl(editingTeacher.experienceCertificateUrl), title: 'شهادة الخبرة' }))}
                                                        <button
                                                            onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.experienceCertificateUrl), title: 'شهادة الخبرة' })}
                                                            className="text-xs text-blue-500 underline break-all block text-right w-full" dir="ltr"
                                                        >
                                                            {getFileUrl(editingTeacher.experienceCertificateUrl)}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">غير متوفرة</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-2">شهادة الإجازة</p>
                                                {editingTeacher.ijazaCertificateUrl ? (
                                                    <div className="space-y-1">
                                                        {renderThumbnail(getFileUrl(editingTeacher.ijazaCertificateUrl), 'شهادة الإجازة', () => setViewingDoc({ url: getFileUrl(editingTeacher.ijazaCertificateUrl), title: 'شهادة الإجازة' }))}
                                                        <button
                                                            onClick={() => setViewingDoc({ url: getFileUrl(editingTeacher.ijazaCertificateUrl), title: 'شهادة الإجازة' })}
                                                            className="text-xs text-blue-500 underline break-all block text-right w-full" dir="ltr"
                                                        >
                                                            {getFileUrl(editingTeacher.ijazaCertificateUrl)}
                                                        </button>
                                                    </div>
                                                ) : editingTeacher.hasIjaza ? (
                                                    <div className="h-32 w-full rounded border-2 border-dashed border-red-300 bg-red-50 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                                                        <span className="text-xs font-medium">المعلم ذكر أنه مجاز ولكن لم يرفع الصورة</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">غير متوفرة</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">التخصصات</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {editingTeacher.subjects && editingTeacher.subjects.length > 0 ? (
                                                editingTeacher.subjects.map((sub, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                                                        {sub}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">لم يتم تحديد تخصصات</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">نبذة تعريفية</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg min-h-[60px]">
                                            {editingTeacher.bio || 'لا توجد نبذة تعريفية.'}
                                        </p>
                                    </div>

                                    {editingTeacher.audioSampleUrl && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">عينة صوتية</h4>
                                            <CustomAudioPlayer
                                                src={getFileUrl(editingTeacher.audioSampleUrl)}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4 border-t dark:border-gray-700 gap-3">
                                        <button
                                            onClick={() => { setEditingTeacher(null); setModalMode(null); }}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                                        >
                                            إغلاق
                                        </button>
                                        {!editingTeacher.isApproved && (
                                            <button
                                                onClick={() => { handleApprove(editingTeacher.id); setEditingTeacher(null); }}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                            >
                                                قبول المعلم
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

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

export default AdminDashboard;
