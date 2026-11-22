import React, { useState, useEffect } from 'react';
import { branding } from '../branding';
import { getFileUrl } from '../utils/mediaUtils';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { StarIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon, ExclamationTriangleIcon, ShareIcon, PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { PlayIcon, CheckIcon, DocumentTextIcon, UserPlusIcon, ArrowRightOnRectangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import DraggableSection from '../components/common/DraggableSection';
import EditableText from '../components/common/EditableText';
import CustomAudioPlayer from '../components/common/CustomAudioPlayer';
import teacherService from '../services/teacherService';
import packagesService from '../services/packagesService';
import bookingsService from '../services/bookingsService';
import { useAuth } from '../context/AuthContext';
import type { TeacherProfileResponse } from '../types/teacher';
import type { Package } from '../types/booking';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import GuestBanner from '../components/common/GuestBanner';



const TeacherProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { user } = useAuth();

    // Data State
    const [teacher, setTeacher] = useState<TeacherProfileResponse | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking Flow State
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Slot Selection State
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [myBookedSlots, setMyBookedSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [proposedTimes, setProposedTimes] = useState<string[]>([]);

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [sectionOrder, setSectionOrder] = useState<string[]>(['bio', 'qualifications', 'experience', 'audio', 'packages']);
    const [isSaving, setIsSaving] = useState(false);

    // Late Join Modal State
    const [showLateJoinModal, setShowLateJoinModal] = useState(false);
    const [lateJoinData, setLateJoinData] = useState<{ missed: number, refund: string } | null>(null);

    // Read-Only Preview State
    const [isReadOnlyPreview, setIsReadOnlyPreview] = useState(false);

    // Guest Modal State
    const [showGuestModal, setShowGuestModal] = useState(false);

    // Document Viewer State
    const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null);

    // Deep Linking
    const [searchParams] = useSearchParams();
    const highlightedPackageId = searchParams.get('packageId');

    // Scroll to package effect
    useEffect(() => {
        if (!loading && packages.length > 0 && highlightedPackageId) {
            const element = document.getElementById(`package-${highlightedPackageId}`);
            if (element) {
                // Small timeout to ensure DOM render
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Provide a visual cue with a temporary "flash" or simpler just persistent highlight check
                }, 100);
            }
        }
    }, [loading, packages, highlightedPackageId]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Check if ID is numeric (Teacher Profile ID)
                const isId = /^\d+$/.test(id || '');
                // Check if ID is a GUID (User ID)
                const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

                let teacherData: TeacherProfileResponse;

                if (isId) {
                    const teacherId = parseInt(id || '0');
                    teacherData = await teacherService.getTeacherById(teacherId);
                } else if (isGuid) {
                    teacherData = await teacherService.getTeacherByUserId(id || '');
                } else {
                    teacherData = await teacherService.getTeacherByUsername(id || '');
                }

                // Fetch packages using the RESOLVED teacher ID
                const packagesData = await packagesService.getTeacherPackages(teacherData.id);

                setTeacher(teacherData);
                setPackages(packagesData);

                // Initialize Order
                if (teacherData.profileSectionsOrder && teacherData.profileSectionsOrder.length > 0) {
                    let order = [...teacherData.profileSectionsOrder];
                    if (!order.includes('audio')) {
                        // Insert audio before packages if possible, otherwise push to end
                        const pkgIndex = order.indexOf('packages');
                        if (pkgIndex > -1) {
                            order.splice(pkgIndex, 0, 'audio');
                        } else {
                            order.push('audio');
                        }
                    }
                    setSectionOrder(order);
                }
            } catch (error) {
                console.error('Error loading teacher data:', error);
                toast.error('An error occurred while loading teacher data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const copyToClipboard = (text: string, successMessage: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => toast.success(successMessage));
        } else {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success(successMessage);
            } catch (err) {
                console.error('Copy failed', err);
                toast.error('Copy failed - your browser does not support automatic copying');
            }
        }
    };

    const handleShareProfile = async () => {
        if (!teacher) return;
        const identifier = teacher.userName || teacher.user?.userName || teacher.id;
        const url = `${window.location.origin}/teacher/${identifier}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: teacher.name,
                    text: `Check out teacher ${teacher.name} on ${branding.nameEn}!`,
                    url: url
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            copyToClipboard(url, 'Profile link copied!');
        }
    };

    const handleSharePackage = async (e: React.MouseEvent, pkg: Package) => {
        e.stopPropagation();
        if (!teacher) return;
        const identifier = teacher.userName || teacher.user?.userName || teacher.id;
        const url = `${window.location.origin}/teacher/${identifier}?packageId=${pkg.id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: pkg.name,
                    text: `Check out this great package from teacher ${teacher.name} on ${branding.nameEn}!`,
                    url: url
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            copyToClipboard(url, 'Package link copied!');
        }
    };

    // Reordering Logic
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...sectionOrder];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newOrder.length) {
            [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
            setSectionOrder(newOrder);
        }
    };

    const handleSaveOrder = async () => {
        if (!teacher) return;
        try {
            setIsSaving(true);
            await teacherService.updateTeacherProfile(teacher.id, {
                profileSectionsOrder: sectionOrder
            });
            toast.success('Section order saved');
            setIsEditMode(false);
        } catch (error) {
            console.error('Error saving order:', error);
            toast.error('An error occurred while saving the order');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateField = async (field: keyof TeacherProfileResponse | string, value: any) => {
        if (!teacher) return;

        // Optimistic Update
        const oldTeacher = { ...teacher };
        setTeacher({ ...teacher, [field]: value });

        try {
            await teacherService.updateTeacherProfile(teacher.id, {
                [field]: value
            });
            toast.success('Updated successfully');
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            toast.error('An error occurred while updating');
            setTeacher(oldTeacher); // Revert
        }
    };

    const handleFileUpload = async (field: string, file: File) => {
        if (!teacher) return;
        const formData = new FormData();
        formData.append(field, file);

        const toastId = toast.loading('Loading file...');
        try {
            await teacherService.updateTeacherProfile(teacher.id, formData);
            toast.success('File loaded', { id: toastId });

            // Refresh Profile to get new URL
            const updatedTeacher = await teacherService.getTeacherById(teacher.id);
            setTeacher(updatedTeacher);

        } catch (error) {
            console.error(`Error uploading ${field}:`, error);
            toast.error('Failed to load file', { id: toastId });
        }
    };

    const handleUpdateProfile = async (updates: Partial<TeacherProfileResponse>) => {
        if (!teacher) return;
        // Optimistic
        const oldTeacher = { ...teacher };
        setTeacher({ ...teacher, ...updates });

        try {
            await teacherService.updateTeacherProfile(teacher.id, updates);
            toast.success('Changes saved');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('An error occurred while saving');
            setTeacher(oldTeacher);
        }
    };

    const isOwner = user?.role === 'Teacher' && user.id === teacher?.userId;
    const isAdmin = user?.role === 'Admin';

    // Helper to check expiration
    const isPackageExpired = (pkg: Package) => {
        if (!pkg.startDate) return false;

        let weeks = 1;
        if (pkg.periodType === 'Monthly') weeks = 4;
        else if (pkg.periodType === 'Yearly') weeks = 48;
        else if (pkg.sessionsCount === 4) weeks = 4; // fallback

        // Expiration Date = StartDate + Duration
        // We add a small buffer (e.g. 1 day) to allow booking on the very last day if needed, 
        // but generally if "Today" > "EndDate", it's expired.
        const startDate = new Date(pkg.startDate);
        // Calculate theoretical end date limit (e.g. 4 weeks from start)
        const limitDate = new Date(startDate);
        limitDate.setDate(limitDate.getDate() + (weeks * 7));

        // If we know available days, find the actual LAST session date to be precise
        if (pkg.availableDays && pkg.availableDays.length > 0) {
            // The valid range is [Start, Start + (weeks*7) - 1].
            // Start checking from the last day of the range backwards.
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + (weeks * 7) - 1);

            // Scan max (weeks * 7) days backwards
            for (let i = 0; i < (weeks * 7); i++) {
                if (pkg.availableDays.includes(checkDate.getDay())) {
                    // Found the last scheduled session day!
                    const endOfLastSession = new Date(checkDate);

                    if (pkg.endTime) {
                        // Parse "HH:mm:ss" or "HH:mm"
                        const [hours, minutes] = pkg.endTime.split(':').map(Number);
                        endOfLastSession.setHours(hours, minutes, 0, 0);
                    } else {
                        endOfLastSession.setHours(23, 59, 59, 999);
                    }

                    const isExpired = new Date() > endOfLastSession;
                    return isExpired;
                }
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        // Fallback: simple duration check
        return new Date() > limitDate;
    };

    const handleSelectPackage = async (pkg: Package) => {
        if (!user) {
            setShowGuestModal(true);
            return;
        }

        // Allow Teachers to VIEW (Read-Only)
        if (user.role === 'Teacher') {
            setIsReadOnlyPreview(true);
        } else if (user.role === 'Student') {
            setIsReadOnlyPreview(false);
        } else {
            // Admin or other roles? Default strict for now
            toast.error('Unknown permission');
            return;
        }

        if (isPackageExpired(pkg)) {
            toast.error('Sorry, this package has expired and is no longer available for booking.');
            return;
        }

        setSelectedPackage(pkg);
        setProposedTimes([]);
        setShowBookingModal(true);

        // Load slots
        setSlotsLoading(true);
        try {
            // Determine range based on package duration
            let weeks = 1;
            if (pkg.periodType === 'Monthly') weeks = 4;
            if (pkg.periodType === 'Yearly') weeks = 48; // Or 52, using 48 based on backend logic

            // Calculate End Date
            const startDate = pkg.startDate ? new Date(pkg.startDate) : new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (weeks * 7) + 7); // Add buffer week

            // Fetch slots for the FULL period
            const [slots, mySlots] = await Promise.all([
                packagesService.getAvailableSlots(pkg.id, startDate, endDate),
                user.role === 'Student'
                    ? packagesService.getMyPackageSlots(pkg.id)
                    : Promise.resolve([])
            ]);
            setAvailableSlots(slots);
            setMyBookedSlots(mySlots);
        } catch (error) {
            console.error('Error loading slots:', error);
            toast.error('An error occurred while loading available slots');
        } finally {
            setSlotsLoading(false);
        }
    };

    // Updated for Recurring Logic
    const isSlotDisabled = (slot: string) => {
        if (!selectedPackage || proposedTimes.length === 0) return false;

        // Allow deselection of own recurring group
        const d = new Date(slot);
        const patternKey = `${d.getDay()}-${d.getHours()}:${d.getMinutes()}`;

        // If this exact pattern is already selected, don't disable it (allow toggle off)
        const isSelectedPattern = proposedTimes.some(t => {
            const pd = new Date(t);
            return `${pd.getDay()}-${pd.getHours()}:${pd.getMinutes()}` === patternKey;
        });
        if (isSelectedPattern) return false;

        // ---------------------------------------------------------
        // Constraint: Buffer Time (Minimum Gap)
        // ---------------------------------------------------------
        // We only need to check buffer conflict against OTHER selected patterns on the SAME DAY OF WEEK.

        if (selectedPackage.sessionBufferMinutes) {
            const bufferMs = selectedPackage.sessionBufferMinutes * 60 * 1000;
            const sessionDurationMs = selectedPackage.durationMinutes * 60 * 1000;
            const myTime = d.getHours() * 60 + d.getMinutes(); // Minutes from start of day

            // Iterate over selected times
            const hasBufferConflict = proposedTimes.some(time => {
                const selectedDate = new Date(time);

                // Only compare if Same Day of Week
                if (selectedDate.getDay() !== d.getDay()) return false;

                const selectedTime = selectedDate.getHours() * 60 + selectedDate.getMinutes();
                const diffMinutes = Math.abs(myTime - selectedTime);
                const diffMs = diffMinutes * 60 * 1000;

                return diffMs < (sessionDurationMs + bufferMs);
            });

            if (hasBufferConflict) return true;
        }

        return false;
    };



    // Helper to calculate truly elapsed sessions
    const calculateElapsedSessions = () => {
        if (!selectedPackage || availableSlots.length === 0) return 0;

        const now = new Date();
        const pastSlots = availableSlots.filter(s => new Date(s) < now);

        if (pastSlots.length === 0) return 0;

        // Group by Week
        const sessionsByType: Record<string, number> = {};

        pastSlots.forEach(slot => {
            const d = new Date(slot);
            const weekId = getWeekId(d);
            if (!sessionsByType[weekId]) sessionsByType[weekId] = 0;
            sessionsByType[weekId]++;
        });

        // Sum up capable sessions logic
        let elapsed = 0;
        const sessionsPerWeek = selectedPackage.sessionsPerWeek || 1;

        Object.values(sessionsByType).forEach(count => {
            // User could have only taken 'sessionsPerWeek' max per week
            elapsed += Math.min(count, sessionsPerWeek);
        });

        // Cap at total sessions count
        return Math.min(elapsed, selectedPackage.sessionsCount);
    };

    const initiateBooking = async () => {
        if (!selectedPackage || !teacher) return;

        // Check for partial booking (Late Join)
        const isLateJoin = selectedPackage.startDate && new Date(selectedPackage.startDate) < new Date();
        const missedSessions = selectedPackage.sessionsCount - proposedTimes.length;

        if (missedSessions > 0) {
            if (isLateJoin) {
                // Allow partial booking but warn
                if (proposedTimes.length === 0) {
                    toast.error('Please select at least one time slot.');
                    return;
                }

                // -------------------------------------------------------------
                // NEW VALIDATION: Check if user selected ALL remaining sessions
                // -------------------------------------------------------------
                const elapsed = calculateElapsedSessions();
                const remainingRequired = selectedPackage.sessionsCount - elapsed;

                // If the user selected FEWER than the remaining future sessions, blocked.
                if (proposedTimes.length < remainingRequired) {
                    toast.error(`You must select all remaining sessions (${remainingRequired}). You selected only ${proposedTimes.length}.`);
                    return;
                }
                // -------------------------------------------------------------

                // Calculate refund
                const refundAmount = ((selectedPackage.price / selectedPackage.sessionsCount) * missedSessions).toFixed(2);

                setLateJoinData({
                    missed: missedSessions,
                    refund: `${refundAmount} ${selectedPackage.currency}`
                });
                setShowLateJoinModal(true);
                return;

            } else {
                // Not late join, enforce full count
                toast.error(`Please select exactly ${selectedPackage.sessionsCount} slots`);
                return;
            }
        } else if (proposedTimes.length > selectedPackage.sessionsCount) {
            toast.error(`You selected more slots than required (${selectedPackage.sessionsCount}).`);
            return;
        }

        // Proceed directly if no modal needed
        processBooking();
    };

    const processBooking = async () => {
        if (!selectedPackage || !teacher) return;

        // Failsafe Validation: Ensure user selected enough sessions
        const elapsed = calculateElapsedSessions();
        const remainingRequired = selectedPackage.sessionsCount - elapsed;
        
        if (proposedTimes.length < remainingRequired) {
            toast.error(`You must select all remaining sessions (${remainingRequired}).`);
            setShowLateJoinModal(false);
            return;
        }

        if (bookingLoading) return; // Already processing

        try {
            setBookingLoading(true);
            await bookingsService.createBooking({
                teacherProfileId: teacher.id,
                packageId: selectedPackage.id,
                proposedTimes: [...proposedTimes].sort(), // Sort copy to avoid mutating state
                timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo'
            });

            toast.success('Booking request sent! We will contact you soon');
            setShowBookingModal(false);
            setShowLateJoinModal(false); // Close if open
            navigate('/student/dashboard');
        } catch (error: any) {
            // Check for specific Insufficient Funds error
            const errorMsg = error.response?.data?.toString() || '';
            if (errorMsg.includes('Insufficient funds')) {
                toast.error('Sorry, your wallet balance is not enough to complete the booking. Please top up.', {
                    duration: 5000,
                    icon: '💳'
                });
            } else {
                // Log only if it's not a known business error
                console.error('Booking Error:', error);
                const displayMsg = error.response?.data || error.message || 'An unexpected error occurred';
                toast.error(`Could not complete the booking: ${displayMsg}`);
            }
        } finally {
            setBookingLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // Recurring Logic: Filter & Group Slots
    // -------------------------------------------------------------------------

    // 1. Identify valid recurring slots
    // We need to find slots that repeat enough times to fulfill the package

    const getWeekId = (d: Date) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;
        const knownSaturday = new Date(2024, 0, 6); // Anchor
        const diff = date.getTime() - knownSaturday.getTime();
        return Math.floor(diff / ONE_WEEK_MS);
    };

    const processRecurringSlots = () => {
        if (!selectedPackage || availableSlots.length === 0) return {};

        // Sort slots chronologically
        const sortedSlots = [...availableSlots].sort();
        if (sortedSlots.length === 0) return {};

        // Find the "First Available Week" to display
        // We look for the first slot's week
        const firstSlotDate = new Date(sortedSlots[0]);
        const firstWeekId = getWeekId(firstSlotDate);

        // Required Occurrences
        let requiredWeeks = 1;
        if (selectedPackage.periodType === 'Monthly') requiredWeeks = 4;
        else if (selectedPackage.periodType === 'Yearly') requiredWeeks = 48;
        else if (selectedPackage.sessionsCount === 4) requiredWeeks = 4; // Fallback for legacy

        // Map: "DayOfWeek-Time" -> [ActualDateStrings]
        const recurringMap: Record<string, string[]> = {};

        sortedSlots.forEach(slot => {
            const d = new Date(slot);
            const key = `${d.getDay()}-${d.getHours()}:${d.getMinutes()}`;
            if (!recurringMap[key]) recurringMap[key] = [];
            recurringMap[key].push(slot);
        });

        // Filter: Keep only keys that have enough occurrences
        // AND ensure the first occurrence is in the "First Display Week" (or close to it) 
        // to avoid displaying a slot that only starts 3 weeks later.

        // Actually, simplificaton: Display slots belonging to the First Available Week found in data.
        // Then, for each slot in that week, check if it repeats requiredWeeks times.

        const displaySlots: Record<string, string[]> = {};

        // Initialize display groups for the FIRST WEEK only
        sortedSlots.forEach(slot => {
            const d = new Date(slot);
            if (getWeekId(d) !== firstWeekId) return; // Only process first week for UI

            // const key = slot; // Specific date string for UI key
            const patternKey = `${d.getDay()}-${d.getHours()}:${d.getMinutes()}`;

            // Check if this pattern repeats enough times
            // We need to ensure we have 'requiredWeeks' occurrences starting from THIS slot
            const allOccurrences = recurringMap[patternKey] || [];

            // Filter occurrences strictly after or equal to this slot
            const validSequence = allOccurrences.filter(s => new Date(s) >= d);

            // We take the first 'requiredWeeks' of them
            if (validSequence.length >= requiredWeeks) {
                // This slot is valid!
                // We map the "Display Slot" to the "Actual Booking Slots" (all 4 weeks)
                // FIX: Group by LOCAL date, not UTC date string
                const localDate = new Date(slot);
                const year = localDate.getFullYear();
                const month = String(localDate.getMonth() + 1).padStart(2, '0');
                const day = String(localDate.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${day}`;

                displaySlots[dateKey] = displaySlots[dateKey] || [];
                displaySlots[dateKey].push(slot);
            }
        });

        return displaySlots;
    };

    // Filter for Fixed Grid Display (Visual Only)
    const getFilteredGridSlots = (groupedSlots: Record<string, string[]>) => {
        const filtered: Record<string, string[]> = {};

        const durationMinutes = selectedPackage?.durationMinutes || 0;
        const bufferMinutes = selectedPackage?.sessionBufferMinutes || 0;
        // Total gap required between start times
        const stepMs = (durationMinutes + bufferMinutes) * 60 * 1000;

        Object.entries(groupedSlots).forEach(([date, slots]) => {
            const sorted = [...slots].sort();
            const dayFiltered: string[] = [];

            let nextValidTime = 0;

            sorted.forEach(slot => {
                const sDate = new Date(slot);
                const sTime = sDate.getTime();

                if (sTime >= nextValidTime) {
                    dayFiltered.push(slot);
                    // Next valid slot must start AFTER this session + buffer
                    nextValidTime = sTime + stepMs;
                }
            });

            filtered[date] = dayFiltered;
        });

        return filtered;
    };

    const recurringGroupedSlots = processRecurringSlots();
    // Apply grid filter for display
    const visibleSlots = getFilteredGridSlots(recurringGroupedSlots);

    // Override toggle for Recurring
    const toggleRecurringSlot = (baseSlot: string) => {
        if (!selectedPackage) return;

        const d = new Date(baseSlot);
        const patternKey = `${d.getDay()}-${d.getHours()}:${d.getMinutes()}`;

        // Re-find all occurrences logic (should maximize reuse, but verifying here)
        const allOccurrences = availableSlots.filter(s => {
            const sd = new Date(s);
            return `${sd.getDay()}-${sd.getHours()}:${sd.getMinutes()}` === patternKey && sd >= d;
        }).sort();

        let requiredWeeks = 1;
        if (selectedPackage.periodType === 'Monthly') requiredWeeks = 4;
        else if (selectedPackage.periodType === 'Yearly') requiredWeeks = 48;
        else if (selectedPackage.sessionsCount === 4) requiredWeeks = 4;

        const slotsToBook = allOccurrences.slice(0, requiredWeeks);

        // Filter out past slots (Partial Booking Logic)
        const now = new Date();
        const futureSlotsToBook = slotsToBook.filter(s => new Date(s) > now);

        // Check if user clicked a past slot (or if the group head is past)
        if (new Date(baseSlot) < now) {
            // Only toast if we are selecting something new
            const isSelectedPattern = proposedTimes.some(t => {
                const pd = new Date(t);
                return `${pd.getDay()}-${pd.getHours()}:${pd.getMinutes()}` === patternKey;
            });

            if (!isSelectedPattern) {
                toast('Only the upcoming sessions were selected for this slot (make-up for missed ones)', { icon: 'ℹ️' });
            }
        }

        const finalSlotsToBook = futureSlotsToBook;

        // Check availability
        // If not late join, enforce full duration. If late join, accept what's left.
        const isLateJoin = selectedPackage.startDate && new Date(selectedPackage.startDate) < new Date();

        if (!isLateJoin && finalSlotsToBook.length < requiredWeeks) {
            toast.error(' Sorry, this slot is not available for all upcoming weeks.');
            return;
        }

        // Check Buffer Conflicts (Explicit Check for Click)
        if (isSlotDisabled(baseSlot) && !proposedTimes.includes(baseSlot)) {
            // We check includes baseSlot specifically, but we should check pattern
            const isSelectedPattern = proposedTimes.some(t => {
                const pd = new Date(t);
                return `${pd.getDay()}-${pd.getHours()}:${pd.getMinutes()}` === patternKey;
            });
            if (!isSelectedPattern) {
                toast.error('Sorry, you must leave enough break time between sessions as set by the teacher.');
                return;
            }
        }

        // Toggle Logic
        // Check if this baseSlot is "Selected" (meaning are its recurring cousins in proposedTimes?)
        const isSelected = proposedTimes.some(t => {
            const pd = new Date(t);
            return `${pd.getDay()}-${pd.getHours()}:${pd.getMinutes()}` === patternKey;
        });

        if (isSelected) {
            // Unselect: Remove ALL related slots
            // We remove any proposedTime that matches the pattern
            setProposedTimes(proposedTimes.filter(t => {
                const pd = new Date(t);
                return `${pd.getDay()}-${pd.getHours()}:${pd.getMinutes()}` !== patternKey;
            }));
        } else {
            // Select: Add ALL related slots
            // Check max sessions per week limit
            if (selectedPackage.sessionsPerWeek) {
                // Count how many "Patterns" are already selected
                // We can count unique patterns in proposedTimes
                const currentPatterns = new Set(proposedTimes.map(t => {
                    const pd = new Date(t);
                    return `${pd.getDay()}-${pd.getHours()}:${pd.getMinutes()}`;
                }));

                if (currentPatterns.size >= selectedPackage.sessionsPerWeek) {
                    toast.error(`You can only select ${selectedPackage.sessionsPerWeek} weekly slots`);
                    return;
                }
            }

            // ---------------------------------------------------------
            // Constraint: One Session Per Day
            // ---------------------------------------------------------
            const hasSameDaySelection = proposedTimes.some(t => {
                const pd = new Date(t);
                const selectedWeekday = pd.getDay();

                // If it's a Weekly recurring package, we check Day of Week (0-6)
                if (selectedPackage.periodType === 'Weekly') {
                    // Check if we already have a slot for this Weekday
                    return selectedWeekday === d.getDay();
                } else {
                    // For Monthly, we might need stricter logic if they pick different weeks?
                    // But actually, for "Recurring Weekly" logic, selecting "Monday" implicitly books ALL Mondays.
                    // So if I select "Monday 10am" and "Monday 12pm", that would be 2 sessions on Monday.
                    // So checking DayOfWeek collision is sufficient for the "Weekly Pattern" logic we implemented.
                    return selectedWeekday === d.getDay();
                }
            });

            if (hasSameDaySelection) {
                toast.error('You cannot select more than one session on the same day (or same weekday for recurring packages).');
                return;
            }

            setProposedTimes([...proposedTimes, ...finalSlotsToBook]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 animate-pulse">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
                        <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
                        <div className="p-8 space-y-4">
                            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600 dark:text-gray-400">Teacher not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <GuestBanner />
            <div className="container mx-auto px-4 max-w-6xl py-8">
                {/* Back Button */}
                <Link
                    to="/teachers-public"
                    className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 mb-6"
                >
                    → Back to Teachers
                </Link>

                {/* Header Section */}
                {isOwner && (
                    <div className="flex justify-end mb-4">
                        {isEditMode ? (
                            <button
                                onClick={handleSaveOrder}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all"
                            >
                                {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                                Save Order
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold shadow-md transition-all"
                            >
                                <PencilSquareIcon className="h-5 w-5" />
                                Enable Editing and Ordering
                            </button>
                        )}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-gold-500 to-gold-600 p-8">
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gold-600 overflow-hidden">
                                {teacher.profilePictureUrl ? (
                                    <img
                                        src={getFileUrl(teacher.profilePictureUrl)}
                                        alt={teacher.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    teacher.name.charAt(0)
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h1 className="text-3xl font-bold text-white mb-2">{teacher.name}</h1>
                                    <button
                                        onClick={handleShareProfile}
                                        className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                                        title="Share Profile"
                                    >
                                        <ShareIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <p className="text-gold-100 text-lg mb-4">{teacher.title}</p>
                                <div className="flex items-center gap-4 text-white">
                                    <div className="flex items-center gap-1">
                                        <StarIcon className="h-5 w-5 text-yellow-300" />
                                        <span className="font-semibold">{teacher.rating.toFixed(1)}</span>
                                        <span className="text-gold-100">({teacher.reviewCount} reviews)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CurrencyDollarIcon className="h-5 w-5" />
                                        {packages.length > 0 ? (
                                            <span>Packages from {Math.min(...packages.map(p => p.price))} {teacher.currency}</span>
                                        ) : (
                                            <span>From {teacher.priceStart} {teacher.currency} / session</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {sectionOrder.map((section, index) => {
                            if (section === 'bio') {
                                return (
                                    <DraggableSection key="bio" id="bio" index={index} onMove={moveSection} isEditing={isEditMode} className="mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About the Teacher</h2>
                                        <EditableText
                                            value={teacher.bio}
                                            onSave={(val) => handleUpdateField('bio', val)}
                                            isEditing={isEditMode}
                                            multiline
                                            className="text-gray-600 dark:text-gray-400 leading-relaxed"
                                        />
                                    </DraggableSection>
                                );
                            }
                            if (section === 'qualifications') {
                                return (
                                    <DraggableSection key="qualifications" id="qualifications" index={index} onMove={moveSection} isEditing={isEditMode} className="mb-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Qualifications Card */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="p-2 bg-gold-50 dark:bg-gold-900/20 rounded-lg">
                                                        <DocumentTextIcon className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Academic Qualifications</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="block text-xs text-gray-400 mb-1">Degree</span>
                                                        <EditableText
                                                            value={teacher.educationDegree}
                                                            onSave={(val) => handleUpdateField('educationDegree', val)}
                                                            isEditing={isEditMode}
                                                            className="text-gray-800 dark:text-gray-200 font-medium text-lg"
                                                            label="Degree"
                                                        />
                                                    </div>

                                                    {/* Edit Mode Extra Fields */}
                                                    {isEditMode && (
                                                        <div className="mt-4 space-y-4 border-t pt-4 dark:border-gray-700">
                                                            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={teacher.isHafiz}
                                                                    onChange={(e) => handleUpdateProfile({ isHafiz: e.target.checked })}
                                                                    className="rounded text-gold-600 focus:ring-gold-500 w-4 h-4"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memorized the entire Quran</span>
                                                            </label>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Degree Certificate</label>
                                                                <div className="flex item-center gap-2">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,application/pdf"
                                                                        onChange={(e) => e.target.files?.[0] && handleFileUpload('QualificationCertificateImage', e.target.files[0])}
                                                                        className="text-sm text-gray-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-100 file:text-xs"
                                                                    />
                                                                    {teacher.qualificationCertificateUrl && <CheckCircleIcon className="h-5 w-5 text-green-500" title="Uploaded" />}
                                                                </div>
                                                                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer mt-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={teacher.showQualificationCertificate ?? false}
                                                                        onChange={(e) => handleUpdateProfile({ showQualificationCertificate: e.target.checked })}
                                                                        className="rounded text-gold-600 focus:ring-gold-500 w-3 h-3"
                                                                    />
                                                                    <span className="text-xs text-gray-500">Public</span>
                                                                </label>
                                                            </div>

                                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer mb-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={teacher.hasIjaza}
                                                                        onChange={(e) => handleUpdateProfile({ hasIjaza: e.target.checked })}
                                                                        className="rounded text-gold-600 focus:ring-gold-500 w-4 h-4"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Ijazah</span>
                                                                </label>

                                                                {teacher.hasIjaza && (
                                                                    <div className="space-y-2 animate-fadeIn">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Ijazah type (e.g. Hafs an Asim)"
                                                                            value={teacher.ijazaType || ''}
                                                                            onChange={(e) => handleUpdateProfile({ ijazaType: e.target.value })}
                                                                            className="w-full text-sm p-2 border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                                                        />
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Ijazah Certificate</label>
                                                                            <div className="flex item-center gap-2">
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*,application/pdf"
                                                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload('IjazaCertificateImage', e.target.files[0])}
                                                                                    className="text-sm text-gray-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-100 file:text-xs"
                                                                                />
                                                                                {teacher.ijazaCertificateUrl && <CheckCircleIcon className="h-5 w-5 text-green-500" title="Uploaded" />}
                                                                            </div>
                                                                            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer mt-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={teacher.showIjazaCertificate ?? false}
                                                                                    onChange={(e) => handleUpdateProfile({ showIjazaCertificate: e.target.checked })}
                                                                                    className="rounded text-gold-600 focus:ring-gold-500 w-3 h-3"
                                                                                />
                                                                                <span className="text-xs text-gray-500">Public</span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!isEditMode && teacher.hasIjaza && (
                                                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                            <span className="text-green-700 dark:text-green-300 font-medium">Ijazah in: {teacher.ijazaType}</span>
                                                        </div>
                                                    )}

                                                    {!isEditMode && teacher.isHafiz && (
                                                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                                            <StarIcon className="h-5 w-5 text-blue-500" />
                                                            <span className="text-blue-700 dark:text-blue-300 font-medium">Memorized the entire Quran</span>
                                                        </div>
                                                    )}

                                                    {/* Certificates Links for Qualifications */}
                                                    {!isEditMode && (
                                                        <div className="flex flex-col gap-2 pt-2">
                                                            {teacher.qualificationCertificateUrl && (teacher.showQualificationCertificate || isOwner || isAdmin) && (
                                                                    <button
                                                                        onClick={() => setViewingDoc({ url: getFileUrl(teacher.qualificationCertificateUrl), title: 'Degree Certificate' })}
                                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gold-700 bg-gold-50 hover:bg-gold-100 dark:bg-gold-900/20 dark:text-gold-400 dark:hover:bg-gold-900/40 rounded-lg transition-colors border border-gold-200 dark:border-gold-800/50">
                                                                        <DocumentTextIcon className="h-4 w-4" />
                                                                        <span>View Degree Certificate</span>
                                                                        {(!teacher.showQualificationCertificate && isOwner) && <span className="text-xs text-red-500 mr-2">(hidden from public)</span>}
                                                                    </button>
                                                            )}
                                                            {teacher.hasIjaza && teacher.ijazaCertificateUrl && (teacher.showIjazaCertificate || isOwner || isAdmin) && (
                                                                    <button
                                                                        onClick={() => setViewingDoc({ url: getFileUrl(teacher.ijazaCertificateUrl), title: 'Quran Ijazah' })}
                                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/50">
                                                                        <DocumentTextIcon className="h-4 w-4" />
                                                                        <span>View Quran Ijazah</span>
                                                                        {(!teacher.showIjazaCertificate && isOwner) && <span className="text-xs text-red-500 mr-2">(hidden from public)</span>}
                                                                    </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Experience Card */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                        <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Work Experience</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="block text-xs text-gray-400 mb-1">Years of Experience</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <EditableText
                                                                value={teacher.experienceYears}
                                                                onSave={(val) => handleUpdateField('experienceYears', val)}
                                                                isEditing={isEditMode}
                                                                className="text-blue-600 dark:text-blue-400 font-bold text-2xl"
                                                                label="Years of Experience"
                                                            />
                                                            <span className="text-gray-500 font-medium">years</span>
                                                        </div>
                                                    </div>
                                                    {/* Certificate Link for Experience */}
                                                    {!isEditMode && teacher.experienceCertificateUrl && (teacher.showExperienceCertificate || isOwner || isAdmin) && (
                                                        <div className="pt-2">
                                                                <button
                                                                    onClick={() => setViewingDoc({ url: getFileUrl(teacher.experienceCertificateUrl), title: 'Experience Certificate' })}
                                                                    className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50">
                                                                    <DocumentTextIcon className="h-4 w-4" />
                                                                    <span>View Experience Certificate</span>
                                                                    {(!teacher.showExperienceCertificate && isOwner) && <span className="text-xs text-red-500 mr-2">(hidden from public)</span>}
                                                                </button>
                                                        </div>
                                                    )}
                                                    {isEditMode && (
                                                        <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Experience Certificate</label>
                                                            <div className="flex item-center gap-2">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload('ExperienceCertificateImage', e.target.files[0])}
                                                                    className="text-sm text-gray-500 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-gray-100 file:text-xs"
                                                                />
                                                                {teacher.experienceCertificateUrl && <CheckCircleIcon className="h-5 w-5 text-green-500" title="Uploaded" />}
                                                            </div>
                                                            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer mt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={teacher.showExperienceCertificate ?? false}
                                                                    onChange={(e) => handleUpdateProfile({ showExperienceCertificate: e.target.checked })}
                                                                    className="rounded text-gold-600 focus:ring-gold-500 w-3 h-3"
                                                                />
                                                                <span className="text-xs text-gray-500">Public</span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DraggableSection>
                                );
                            }
                            if (section === 'subjects') {
                                return (
                                    <DraggableSection key="subjects" id="subjects" index={index} onMove={moveSection} isEditing={isEditMode} className="mb-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Specialties</h3>
                                        {isEditMode ? (
                                            <div className="space-y-2">
                                                <EditableText
                                                    value={teacher.subjects.join(', ')}
                                                    onSave={(val) => handleUpdateField('subjects', val.split(',').map(s => s.trim()).filter(Boolean))}
                                                    isEditing={true}
                                                    placeholder="Enter specialties separated by commas"
                                                />
                                                <p className="text-xs text-gray-400">Separate specialties with commas</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {teacher.subjects.map((subject: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400 rounded-full text-sm"
                                                    >
                                                        {subject}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </DraggableSection>
                                );
                            }
                            if (section === 'audio' && teacher.audioSampleUrl) {
                                // Only show if isOwner/isAdmin (can see hidden) or if public and showAudioSample is true
                                if (!isOwner && !isAdmin && !teacher.showAudioSample) return null;

                                return (
                                    <DraggableSection key="audio" id="audio" index={index} onMove={moveSection} isEditing={isEditMode} className="mb-6">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                        <PlayIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                                        Audio Sample
                                                    </h3>
                                                </div>
                                                {(!teacher.showAudioSample && (isOwner || isAdmin) && !isEditMode) && (
                                                    <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full font-medium border border-red-100 dark:border-red-800">(hidden from public)</span>
                                                )}
                                            </div>
                                            <div className="mt-4 flex justify-center w-full">
                                                <CustomAudioPlayer
                                                    src={getFileUrl(teacher.audioSampleUrl)}
                                                    className="w-full max-w-lg"
                                                />
                                            </div>
                                            {isEditMode && (
                                                <div className="mt-6 border-t pt-4 dark:border-gray-700">
                                                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={teacher.showAudioSample ?? false}
                                                            onChange={(e) => handleUpdateProfile({ showAudioSample: e.target.checked })}
                                                            className="rounded text-gold-600 focus:ring-gold-500 w-4 h-4"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show audio sample on public profile</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </DraggableSection>
                                );
                            }
                            if (section === 'packages') {
                                return (
                                    <DraggableSection key="packages" id="packages" index={index} onMove={moveSection} isEditing={isEditMode}>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Packages</h2>

                                        {packages.length === 0 ? (
                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                                                <p className="text-gray-500 dark:text-gray-400">No packages available right now</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {packages.map((pkg) => (
                                                    <div
                                                        key={pkg.id}
                                                        id={`package-${pkg.id}`}
                                                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border p-6 hover:shadow-xl transition-all duration-500
                                                        ${highlightedPackageId === pkg.id.toString()
                                                                ? 'border-gold-500 ring-4 ring-gold-500/30 scale-[1.02] z-10'
                                                                : 'border-gray-200 dark:border-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                                                            <button
                                                                onClick={(e) => handleSharePackage(e, pkg)}
                                                                className="text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 p-1"
                                                                title="Share Package"
                                                            >
                                                                <ShareIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                        <p className="text-gray-600 dark:text-gray-400 mb-4 min-h-[3rem]">{pkg.description}</p>

                                                        <div className="space-y-2 mb-6">
                                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                                <span>{pkg.sessionsCount} sessions</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                                <ClockIcon className="h-5 w-5 text-blue-500" />
                                                                <span>{pkg.durationMinutes} min per session</span>
                                                            </div>
                                                            {pkg.allowedGender && pkg.allowedGender !== 'All' && (
                                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-2">
                                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${pkg.allowedGender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                                                                        }`}>
                                                                        For: {pkg.allowedGender === 'Male' ? 'Male only' : 'Female only'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="border-t dark:border-gray-700 pt-4 mb-4">
                                                            <div className="text-3xl font-bold text-gold-600 mb-1">
                                                                {pkg.price} <span className="text-lg">{pkg.currency === 'EGP' ? 'EGP' : 'EGP'}</span>
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {(pkg.price / pkg.sessionsCount).toFixed(2)} EGP per session
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            const isFull = (pkg.maxStudents && pkg.activeBookingsCount !== undefined)
                                                                ? pkg.activeBookingsCount >= pkg.maxStudents
                                                                : false;
                                                            const expired = isPackageExpired(pkg);

                                                            return (
                                                                <button
                                                                    id={`btn-book-${pkg.id}`}
                                                                    onClick={() => handleSelectPackage(pkg)}
                                                                    disabled={expired || (isFull && user?.role !== 'Teacher') || (!!pkg.currentUserBookingStatus && user?.role !== 'Teacher')}
                                                                    className={`w-full py-3 font-bold rounded-lg transition-colors ${(expired || (isFull && user?.role !== 'Teacher') || (!!pkg.currentUserBookingStatus && user?.role !== 'Teacher'))
                                                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                        : user?.role === 'Teacher' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-tomato-500 hover:bg-tomato-600 text-white'
                                                                        } ${pkg.currentUserBookingStatus === 'Confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : ''}`}
                                                                >
                                                                    {user?.role === 'Teacher'
                                                                        ? 'View Slots (teacher)'
                                                                        : pkg.currentUserBookingStatus
                                                                            ? (pkg.currentUserBookingStatus === 'Pending' ? 'Request under review' : 'Already enrolled')
                                                                            : isFull ? 'Full' : expired ? 'This package has ended' : 'Book Now'}
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </DraggableSection>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>

                {/* Booking Modal */}
                {/* Late Join Confirmation Modal */}
                {showLateJoinModal && lateJoinData && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 transform transition-all scale-100">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white text-center">
                                <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2 text-white/90" />
                                <h3 className="text-xl font-bold">Note: Late Enrollment</h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                                    This package has already started and you missed
                                    <span className="font-bold text-orange-600 dark:text-orange-400 mx-1">{lateJoinData.missed}</span>
                                    sessions.
                                </p>

                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full shrink-0">
                                        <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">Automatic Compensation Policy</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            The cost of missed sessions will be refunded
                                            (<span className="font-bold text-green-600 dark:text-green-400">{lateJoinData.refund}</span>)
                                            to your wallet automatically once the teacher accepts your request.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    onClick={() => setShowLateJoinModal(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processBooking}
                                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02]"
                                >
                                    Continue Booking
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Guest Booking Modal */}
                <Modal
                    isOpen={showGuestModal}
                    onClose={() => setShowGuestModal(false)}
                    title="Sign in to start learning"
                    size="md"
                >
                    <div className="space-y-6 py-4 text-center">
                        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserGroupIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                            To start booking sessions with this teacher, please sign in first. 
                            If you don't have an account, you can easily create a new student account.
                        </p>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3.5 bg-tomato-500 hover:bg-tomato-600 text-white rounded-xl font-bold shadow-lg shadow-tomato-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register/student')}
                                className="w-full py-3.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <UserPlusIcon className="h-5 w-5 text-primary-600" />
                                Create Student Account
                            </button>
                            <button
                                onClick={() => setShowGuestModal(false)}
                                className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {showBookingModal && selectedPackage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
                            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Session Times</h2>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Required: {selectedPackage.sessionsCount} sessions | Selected: {proposedTimes.length}
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                        {selectedPackage.periodType
                                            ? `* ${selectedPackage.periodType}: ${selectedPackage.sessionsPerWeek} sessions/week`
                                            : selectedPackage.sessionsCount === 4
                                                ? '* One-session-per-week rule applies'
                                                : ''}
                                        {selectedPackage.sessionBufferMinutes
                                            ? ` | ${selectedPackage.sessionBufferMinutes} min break`
                                            : ''}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-2 font-semibold">
                                        🕒 Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                                    </p>
                                </div>
                                <button onClick={() => setShowBookingModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {slotsLoading ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
                                        <p className="mt-2 text-gray-600">Loading available slots...</p>
                                    </div>
                                ) : Object.keys(visibleSlots).length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No slots available for this package right now (it may be full or finished).
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(visibleSlots).sort().map(([date, slots]) => (
                                            <div key={date}>
                                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-1 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                                                    {new Date(date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                                    {slots.map(slot => {
                                                        const isSelected = proposedTimes.includes(slot);
                                                        const isDisabled = isSlotDisabled(slot);
                                                        const isPast = new Date(slot) < new Date();
                                                        const time = new Date(slot).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

                                                        // Check if ALL occurrences are past
                                                        const d = new Date(slot);
                                                        const patternKey = `${d.getDay()}-${d.getHours()}:${d.getMinutes()}`;
                                                        const hasFuture = availableSlots.some(s => {
                                                            const sd = new Date(s);
                                                            return `${sd.getDay()}-${sd.getHours()}:${sd.getMinutes()}` === patternKey && sd > new Date();
                                                        });

                                                        // If no future sessions for this slot, it's fully expired/unbookable
                                                        if (!hasFuture) {
                                                            return (
                                                                <div
                                                                    key={slot}
                                                                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700 flex flex-col items-center justify-center cursor-not-allowed opacity-60"
                                                                >
                                                                    <span className="line-through">{time}</span>
                                                                    <span className="text-[10px]">Ended</span>
                                                                </div>
                                                            );
                                                        }

                                                        // If partial past (some future remain)
                                                        if (isPast) {
                                                            return (
                                                                <button
                                                                    key={slot}
                                                                    onClick={() => toggleRecurringSlot(slot)}
                                                                    className="relative group px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-500 border border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 flex flex-col items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="Click to select upcoming sessions at this time"
                                                                >
                                                                    <div
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toast('Important:\n\nThis slot has already started.\nBy choosing it, only the remaining upcoming sessions (in the following weeks) will be booked.\n\nPayment: the cost of missed sessions will be refunded to your wallet automatically once the teacher accepts your request.', {
                                                                                duration: 8000,
                                                                                icon: 'ℹ️'
                                                                            });
                                                                        }}
                                                                        className="absolute -top-1 -right-1 bg-white dark:bg-gray-700 rounded-full text-blue-500 shadow-sm cursor-help hover:scale-110 transition-transform z-10"
                                                                        title="What does this mean?"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="line-through opacity-75">{time}</span>
                                                                    <span className="text-[10px] font-bold">Missed (make-up)</span>
                                                                </button>
                                                            );
                                                        }

                                                        // Check if this slot is already booked by ME
                                                        // We check if the specific slot string exists in myBookedSlots
                                                        // OR if it's a recurring pattern conflict with my booking (optional, but specific slot is safer)
                                                        const isMyBooking = myBookedSlots.includes(slot);

                                                        if (isMyBooking) {
                                                            return (
                                                                <div
                                                                    key={slot}
                                                                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gold-50 text-gold-700 border border-gold-300 dark:bg-gold-900/20 dark:text-gold-400 dark:border-gold-800 flex flex-col items-center justify-center cursor-default shadow-sm"
                                                                    title="You already booked this slot"
                                                                >
                                                                    <span className="font-bold">{time}</span>
                                                                    <span className="text-[10px] items-center flex gap-1">
                                                                        <CheckCircleIcon className="h-3 w-3" />
                                                                        My Booking
                                                                    </span>
                                                                </div>
                                                            );
                                                        }

                                                        // If Read-Only, clicking does nothing
                                                        const handleClick = () => {
                                                            if (isReadOnlyPreview) return;
                                                            toggleRecurringSlot(slot);
                                                        };

                                                        return (
                                                            <button
                                                                key={slot}
                                                                onClick={handleClick}
                                                                disabled={isDisabled && !isSelected}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isSelected
                                                                    ? 'bg-gold-500 text-white shadow-md transform scale-105'
                                                                    : (isDisabled || isReadOnlyPreview)
                                                                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-default' // Specific style for read-only
                                                                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                                                    }`}
                                                            >
                                                                {time}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!isReadOnlyPreview && (
                                <div className="p-6 border-t dark:border-gray-700 flex gap-4 bg-gray-50 dark:bg-gray-900/50">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            * Selected times are final and will be booked directly.
                                        </p>
                                    </div>
                                    <button
                                        onClick={initiateBooking}
                                        disabled={bookingLoading || proposedTimes.length === 0}
                                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                                    </button>
                                </div>
                            )}
                            {isReadOnlyPreview && (
                                <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center">
                                    <p className="text-gray-500 font-medium">View-only mode (teachers)</p>
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
                                    <span>Open in New Window</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div >
    );
};

export default TeacherProfile;
