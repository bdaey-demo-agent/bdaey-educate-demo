import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import { PlusIcon, TrashIcon, ClockIcon, PencilIcon, ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../../components/common/ConfirmModal';
import packagesService from '../../services/packagesService';
import teacherService from '../../services/teacherService';
import type { Package } from '../../types/booking';
import toast from 'react-hot-toast';


// Helper to get ISO string with local timezone offset
const toISOWithOffset = (date: Date) => {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
};

interface TeacherPackagesProps {
    demoMode?: boolean;
}

const TeacherPackages: React.FC<TeacherPackagesProps> = ({ demoMode = false }) => {


    const { teacherId } = useParams<{ teacherId: string }>();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [targetTeacherName, setTargetTeacherName] = useState<string>('');

    const [activeTab, setActiveTab] = useState<'Active' | 'Archived'>('Active');
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(!demoMode);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null); // For deletion modal
    const [penaltyAmount, setPenaltyAmount] = useState<number>(50); // Default, updated from profile

    // Restore logic
    const [restoreId, setRestoreId] = useState<number | null>(null);
    const [newStartDate, setNewStartDate] = useState<string>('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        durationMinutes: 45,
        price: 0,
        availableDays: [] as number[],
        startTime: '09:00',
        endTime: '17:00',
        maxStudents: 10,
        periodType: 'Monthly' as 'Weekly' | 'Monthly' | 'Yearly',
        sessionsPerWeek: 1,
        sessionBufferMinutes: 15,
        startDate: toISOWithOffset(new Date()).split('T')[0],
        timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
        allowedGender: 'All' as 'All' | 'Male' | 'Female'
    });

    const WEEKDAYS = [
        { id: 6, label: 'Saturday' },
        { id: 0, label: 'Sunday' },
        { id: 1, label: 'Monday' },
        { id: 2, label: 'Tuesday' },
        { id: 3, label: 'Wednesday' },
        { id: 4, label: 'Thursday' },
        { id: 5, label: 'Friday' },
    ];

    // Auto Calculate Max Students
    useEffect(() => {
        if (!formData.startTime || !formData.endTime || !formData.durationMinutes) return;

        // 1. Calculate Daily Available Minutes
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        let endMinutes = endH * 60 + endM;

        // Handle overnight (e.g. 22:00 to 02:00)
        if (endMinutes < startMinutes) {
            endMinutes += 24 * 60; // Add 24 hours
        }

        const totalDailyMinutes = endMinutes - startMinutes;

        if (totalDailyMinutes <= 0) return;

        // 2. Calculate Minutes Per Slot (Duration + Buffer)
        const slotMinutes = formData.durationMinutes + (formData.sessionBufferMinutes || 0);

        // 3. Slots Per Day
        const slotsPerDay = Math.floor(totalDailyMinutes / slotMinutes);

        // 4. Total Weekly Slots = SlotsPerDay * WorkingDays
        const workingDaysCount = formData.availableDays.length;
        const totalWeeklySlots = slotsPerDay * workingDaysCount;

        // 5. Max Students = TotalWeeklySlots / SessionsPerStudent
        const sessionsPerStudent = formData.sessionsPerWeek || 1;

        let calculatedMax = Math.floor(totalWeeklySlots / sessionsPerStudent);
        if (calculatedMax < 0) calculatedMax = 0;

        // Only update if changed to avoid loop
        if (formData.maxStudents !== calculatedMax && (!editingId || !packages.find(p => p.id === editingId)?.hasActiveBookings)) {
            setFormData(prev => ({ ...prev, maxStudents: calculatedMax }));
        }

    }, [
        formData.startTime,
        formData.endTime,
        formData.durationMinutes,
        formData.sessionBufferMinutes,
        formData.availableDays.length,
        formData.sessionsPerWeek
    ]);


    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        if (demoMode) {
            // Mock Packages
            const mockPackages: any[] = [
                {
                    id: 1, name: 'Intensive Memorization Package', description: '5 sessions per week to memorize the entire Quran within two years.',
                    price: 800, currency: 'EGP', durationMinutes: 60, sessionsCount: 20, periodType: 'Monthly',
                    sessionsPerWeek: 5, hasActiveBookings: false
                },
                {
                    id: 2, name: 'Recitation Correction', description: 'One weekly session to refine recitation and Tajweed rules.',
                    price: 200, currency: 'EGP', durationMinutes: 45, sessionsCount: 4, periodType: 'Monthly',
                    sessionsPerWeek: 1, hasActiveBookings: true
                },
                {
                    id: 3, name: 'Children Foundation (Noor Al-Bayan)', description: 'The Noor Al-Bayan curriculum teaching reading and writing to children from age 5.',
                    price: 600, currency: 'EGP', durationMinutes: 30, sessionsCount: 12, periodType: 'Monthly',
                    sessionsPerWeek: 3, hasActiveBookings: false, allowedGender: 'All'
                }
            ];
            setPackages(mockPackages);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let finalId: number | null = null;

            if (isAdmin && teacherId) {
                finalId = parseInt(teacherId);
                const teacherProfile = await adminService.getTeacherProfile(finalId);
                setTargetTeacherName(teacherProfile.name);
                if (teacherProfile.packageDeletionPenalty !== undefined) {
                    setPenaltyAmount(teacherProfile.packageDeletionPenalty);
                }
            } else if (!isAdmin) {
                const profile = await teacherService.getMyProfile();
                if (profile?.id) {
                    finalId = profile.id;
                    if (profile.effectivePackageDeletionPenalty !== undefined) {
                        setPenaltyAmount(profile.effectivePackageDeletionPenalty);
                    }
                }
            } else {
                // Admin but no teacherId - maybe show error or redirect?
                // For now, just stop loading
                setLoading(false);
                return;
            }

            if (finalId) {
                const fetchedPackages = await packagesService.getTeacherPackages(finalId);
                setPackages(fetchedPackages);

                // Auto-open edit modal if editId is present
                if (editId) {
                    const pkgToEdit = fetchedPackages.find(p => p.id === parseInt(editId));
                    if (pkgToEdit) {
                        setEditingId(pkgToEdit.id);
                        setFormData({
                            name: pkgToEdit.name,
                            description: pkgToEdit.description,
                            durationMinutes: pkgToEdit.durationMinutes,
                            price: pkgToEdit.price,
                            availableDays: pkgToEdit.availableDays || [],
                            startTime: pkgToEdit.startTime || '09:00',
                            endTime: pkgToEdit.endTime || '17:00',
                            maxStudents: pkgToEdit.maxStudents || 10,
                            periodType: (pkgToEdit.periodType as any) || 'Monthly',
                            sessionsPerWeek: pkgToEdit.sessionsPerWeek || 1,
                            sessionBufferMinutes: pkgToEdit.sessionBufferMinutes || 15,
                            startDate: pkgToEdit.startDate ? toISOWithOffset(new Date(pkgToEdit.startDate)).split('T')[0] : toISOWithOffset(new Date()).split('T')[0],
                            timezoneId: pkgToEdit.timezoneId || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
                            allowedGender: pkgToEdit.allowedGender || 'All'
                        });
                        setShowModal(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Date & Time
        const now = new Date();
        const selectedStart = new Date(formData.startDate);
        const [startH, startM] = formData.startTime.split(':').map(Number);

        // Create a specific Date object for the start time on the selected start date
        // Ensure seconds and milliseconds are zeroed to match backend slot generation logic
        selectedStart.setHours(startH, startM, 0, 0);

        // We allow 5 minutes buffer for "just now" submissions to avoid frustration
        const bufferTime = new Date(now.getTime() - 5 * 60000);

        if (selectedStart < bufferTime) {
            toast.error('The package start time cannot be in the past.');
            return;
        }

        // Validation: Ensure enough available days for the sessions per week (One Session Per Day Rule)
        if (formData.availableDays.length < formData.sessionsPerWeek) {
            toast.error(`The selected days (${formData.availableDays.length}) are not enough. Choose at least ${formData.sessionsPerWeek} days for this package (max one session per day).`);
            return;
        }

        // VALIDATION: Start Date must be the first available day of the week (Saturday-first)
        const normalizedStartDay = (selectedStart.getDay() + 1) % 7;
        const minAvailableDay = Math.min(...formData.availableDays.map(d => (d + 1) % 7));

        if (normalizedStartDay !== minAvailableDay) {
            const firstDayName = WEEKDAYS.find(w => (w.id + 1) % 7 === minAvailableDay)?.label;
            toast.error(`Invalid package start date. The package must start on its first available day of the week (${firstDayName}).`);
            return;
        }

        try {
            // Create a data object to send, ensuring startDate has the offset
            const submissionData: any = {
                ...formData,
                startDate: toISOWithOffset(selectedStart)
            };

            if (isAdmin && teacherId) {
                submissionData.teacherProfileId = parseInt(teacherId);
            }

            if (editingId) {
                await packagesService.updatePackage(editingId, submissionData);
                toast.success('Package updated successfully!');
            } else {
                await packagesService.createPackage(submissionData);
                toast.success('Package created successfully!');
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                durationMinutes: 45,
                price: 0,
                availableDays: [],
                startTime: '09:00',
                endTime: '17:00',
                maxStudents: 10,
                periodType: 'Monthly',
                sessionsPerWeek: 1,
                sessionBufferMinutes: 15,
                startDate: new Date().toISOString().split('T')[0],
                timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
                allowedGender: 'All'
            });
            loadPackages();
        } catch (error: any) {
            let msg = 'An error occurred during the operation';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    msg = error.response.data;
                } else if (typeof error.response.data === 'object') {
                    msg = error.response.data.message || error.response.data.title || JSON.stringify(error.response.data);
                }
            }
            toast.error(msg);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await packagesService.deletePackage(deleteId);
            toast.success('Package archived successfully');
            loadPackages();
        } catch (error) {
            console.error('Error deleting package:', error);
            toast.error('An error occurred while deleting');
        } finally {
            setDeleteId(null);
        }
    };

    const confirmRestore = async () => {
        if (!restoreId) return;

        try {
            // Only pass newStartDate if the user selected one
            await packagesService.restorePackage(restoreId, newStartDate || undefined);
            toast.success('Package restored successfully');
            loadPackages();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Could not restore the package; it may have expired and needs updating.');
            console.error('Error restoring package:', error);
        } finally {
            setRestoreId(null);
            setNewStartDate('');
        }
    };

    const handleDeleteClick = (packageId: number) => {
        setDeleteId(packageId);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {isAdmin && (
                <div className="mb-4">
                    <Link to="/admin/teachers" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-bold">
                        <ChevronRightIcon className="h-4 w-4" /> Back to Teachers List
                    </Link>
                </div>
            )}
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-3xl font-bold font-heading text-primary-900 dark:text-white mb-2">
                        {isAdmin ? `Teacher packages: ${targetTeacherName}` : 'My Teaching Packages'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'You can manage and edit this teacher packages or add new ones to help them.' : 'Design your teaching packages and control your schedule and prices easily'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            description: '',
                            durationMinutes: 45,
                            price: 0,
                            availableDays: [],
                            startTime: '09:00',
                            endTime: '17:00',
                            maxStudents: 10,
                            periodType: 'Monthly',
                            sessionsPerWeek: 1,
                            sessionBufferMinutes: 15,
                            startDate: toISOWithOffset(new Date()).split('T')[0],
                            timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
                            allowedGender: 'All'
                        });
                        setShowModal(true);
                    }}
                    data-tour="teacher-add-package"
                    className="btn-primary flex items-center gap-2 px-6 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-gold-600 dark:text-gold-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-bold"
                >
                    <PlusIcon className="h-6 w-6" />
                    <span>Add New Package</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-1 mb-6 max-w-sm">
                <button
                    onClick={() => setActiveTab('Active')}
                    className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all ${activeTab === 'Active'
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Active Packages
                </button>
                <button
                    onClick={() => setActiveTab('Archived')}
                    className={`flex-1 py-2 text-center rounded-lg font-bold text-sm transition-all ${activeTab === 'Archived'
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Archived Packages
                </button>
            </div>


            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : packages.filter(p => activeTab === 'Active' ? !['Archived', 'Deleted', 'Completed', 'Paused'].includes(p.status || '') : ['Archived', 'Deleted', 'Completed', 'Paused'].includes(p.status || '')).length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700" data-tour="teacher-packages-empty">
                    <div className="bg-primary-50 dark:bg-primary-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PlusIcon className="h-10 w-10 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {activeTab === 'Active' ? 'Start by adding your first package' : 'No archived packages'}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        {activeTab === 'Active' ? 'Create varied teaching packages to attract students. You can set the price, schedule, and number of sessions.' : 'Expired or deleted packages appear here for 30 days before permanent deletion.'}
                    </p>
                    {activeTab === 'Active' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-primary-600 font-bold hover:underline"
                        >
                            Click to Create a Package
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.filter(p => activeTab === 'Active' ? !['Archived', 'Deleted', 'Completed', 'Paused'].includes(p.status || '') : ['Archived', 'Deleted', 'Completed', 'Paused'].includes(p.status || '')).map((pkg) => (
                        <div key={pkg.id} className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden ${activeTab === 'Archived' ? 'opacity-75 grayscale gap' : ''}`}>
                            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary-500 to-primary-600 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-xl">
                                        <ClockIcon className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div className="flex gap-2 transition-opacity">
                                        {['Archived', 'Deleted', 'Completed', 'Paused'].includes(pkg.status || '') ? (
                                            <button
                                                onClick={() => setRestoreId(pkg.id)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                                                title="Restore Package"
                                            >
                                                <ArrowPathIcon className="h-5 w-5 text-primary-600" />
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (!isAdmin && pkg.hasPendingBookings) {
                                                            toast.error('Cannot edit while there are pending requests');
                                                            return;
                                                        }
                                                        setEditingId(pkg.id);
                                                        setFormData({
                                                            name: pkg.name,
                                                            description: pkg.description,
                                                            durationMinutes: pkg.durationMinutes,
                                                            price: pkg.price,
                                                            availableDays: pkg.availableDays || [],
                                                            startTime: pkg.startTime || '09:00',
                                                            endTime: pkg.endTime || '17:00',
                                                            maxStudents: pkg.maxStudents || 10,
                                                            periodType: (pkg.periodType as any) || 'Monthly',
                                                            sessionsPerWeek: pkg.sessionsPerWeek || 1,
                                                            sessionBufferMinutes: pkg.sessionBufferMinutes || 15,
                                                            startDate: pkg.startDate ? toISOWithOffset(new Date(pkg.startDate)).split('T')[0] : toISOWithOffset(new Date()).split('T')[0],
                                                            timezoneId: pkg.timezoneId || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
                                                            allowedGender: pkg.allowedGender || 'All'
                                                        });
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(pkg.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    title="Archive Package"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{pkg.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">{pkg.description}</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                            {pkg.sessionsCount}
                                        </span>
                                        <span>
                                            sessions {pkg.periodType === 'Weekly' ? 'per week' : pkg.periodType === 'Yearly' ? 'per year' : 'per month'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            <ClockIcon className="h-4 w-4" />
                                        </span>
                                        <span>{pkg.durationMinutes} min / session</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${pkg.allowedGender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                            pkg.allowedGender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            Allowed: {pkg.allowedGender === 'Male' ? 'Male only' : pkg.allowedGender === 'Female' ? 'Female only' : 'Everyone'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Package Price</p>
                                        <p className="text-2xl font-bold text-primary-600 font-heading">
                                            {pkg.price} <span className="text-sm font-sans font-normal text-gray-500">{pkg.currency}</span>
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${pkg.status === 'Archived' || pkg.status === 'Paused'
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {pkg.status === 'Archived' || pkg.status === 'Paused' ? 'Archived' : 'Active'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Package Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-gray-700">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                                    <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                                        <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                                            {editingId ? 'Edit Package' : 'Create New Package'}
                                        </h3>
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Fill in the package details accurately so students can book it.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="bg-gray-100 dark:bg-gray-700 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {packages.find(p => p.id === editingId)?.hasActiveBookings && (
                                    <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 flex items-start gap-2">
                                        <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                                            ⚠️ Note: schedule and price cannot be edited while there are active bookings.
                                        </span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Package Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Example: Complete Foundation Package"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Package Description</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Write an engaging description of what the student will learn..."
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Package Start Date
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]} // Blocks past dates
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">The date the package becomes available to students.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Gender</label>
                                        <select
                                            disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                            value={formData.allowedGender}
                                            onChange={(e) => setFormData({ ...formData, allowedGender: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                        >
                                            <option value="All">Everyone</option>
                                            <option value="Male">Male only</option>
                                            <option value="Female">Female only</option>
                                        </select>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <ClockIcon className="h-5 w-5 text-primary-600" />
                                            Schedule and Time Details
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Repeat</label>
                                                <select
                                                    disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                    value={formData.periodType}
                                                    onChange={(e) => setFormData({ ...formData, periodType: e.target.value as any })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                                >
                                                    <option value="Weekly">Weekly</option>
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Yearly">Yearly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sessions per Week</label>
                                                <select
                                                    disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                    value={formData.sessionsPerWeek}
                                                    onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                                >
                                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Session Duration (min)</label>
                                                <select
                                                    disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                    required
                                                    value={formData.durationMinutes}
                                                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                                >
                                                    <option value="30">30 minutes</option>
                                                    <option value="45">45 minutes</option>
                                                    <option value="60">60 minutes</option>
                                                    <option value="90">90 minutes</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Break Between Sessions (min)</label>
                                                <select
                                                    disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                    value={formData.sessionBufferMinutes}
                                                    onChange={(e) => setFormData({ ...formData, sessionBufferMinutes: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                                >
                                                    <option value="0">No break</option>
                                                    <option value="10">10 minutes</option>
                                                    <option value="15">15 minutes</option>
                                                    <option value="30">30 minutes</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Available Days</label>
                                            <div className="flex flex-wrap gap-2">
                                                {WEEKDAYS.map((day) => (
                                                    <button
                                                        key={day.id}
                                                        type="button"
                                                        disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                        onClick={() => {
                                                            const days = formData.availableDays.includes(day.id)
                                                                ? formData.availableDays.filter(d => d !== day.id)
                                                                : [...formData.availableDays, day.id];
                                                            setFormData({ ...formData, availableDays: days });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.availableDays.includes(day.id)
                                                            ? 'bg-primary-600 text-white shadow-md'
                                                            : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {day.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
                                                <input
                                                    type="time"
                                                    disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                    required
                                                    value={formData.startTime}
                                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
                                                <input
                                                    type="time"
                                                    disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                    required
                                                    value={formData.endTime}
                                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Price (EGP)</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">EGP</span>
                                            </div>
                                            <input
                                                type="number"
                                                disabled={!!packages.find(p => p.id === editingId)?.hasActiveBookings}
                                                required
                                                min="0"
                                                value={formData.price || ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setFormData({ ...formData, price: isNaN(val) ? 0 : val });
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 pr-12 text-lg font-bold text-primary-600"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {editingId ? 'Save Changes' : 'Create Package'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Archive Package"
                message={`⚠️ Warning: all active bookings will be cancelled and students refunded their remaining amounts. The package will be archived and permanently deleted after 30 days. A penalty of ${penaltyAmount} EGP will be deducted from your balance for cancelling the package (nothing is deducted if there are no active bookings). Are you sure?`}
                confirmText="Yes, archive and accept the penalty"
                cancelText="Cancel"
                isDanger={true}
            />

            {/* Restore Confirmation Modal */}
            <ConfirmModal
                isOpen={!!restoreId}
                onClose={() => { setRestoreId(null); setNewStartDate(''); }}
                onConfirm={confirmRestore}
                title="Restore Package"
                message={`Are you sure you want to restore this package from the archive? \n\n If its start date is in the past, you must enter a new date:`}
                confirmText="Confirm Restore"
                cancelText="Cancel"
                isDanger={false}
            >
                <div className="mt-4 text-right">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Start Date (optional unless the old one expired)
                    </label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-right"
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </ConfirmModal>

        </div>
    );
};

export default TeacherPackages;
