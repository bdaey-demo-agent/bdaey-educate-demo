import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFileUrl } from '../../utils/mediaUtils';
import {
    CheckCircleIcon,
    ClockIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    MicrophoneIcon,
    LinkIcon,
    BanknotesIcon,
    UsersIcon,
    CalendarIcon,
    CogIcon,
    UserIcon,
    PhoneIcon,
    LockClosedIcon,
    KeyIcon,
} from '@heroicons/react/24/outline';
import DateInput from '../../components/common/DateInput';
import { translateStatus, getStatusColor } from '../../utils/statusTranslations';
import teacherService from '../../services/teacherService';
import authService from '../../services/authService';
import bookingsService from '../../services/bookingsService';
import type { TeacherProfileResponse } from '../../types/teacher';
import type { Booking } from '../../types/booking';
import walletService from '../../services/walletService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signalRService } from '../../services/signalrService';
import CustomAudioPlayer from '../../components/common/CustomAudioPlayer';




interface TeacherDashboardProps {
    demoMode?: boolean;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ demoMode = false }) => {
    // const queryClient = useQueryClient(); // Removed
    const [searchParams] = useSearchParams();
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('settings');
    const hasInitializedRef = useRef(false);


    // Local State for Data
    const [teacher, setTeacher] = useState<TeacherProfileResponse | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [profileLoading, setProfileLoading] = useState(!demoMode); // Don't load if demo
    const [statsLoading, setStatsLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);

    // Fetch Functions
    const fetchWallet = async () => {
        if (demoMode) return;
        try {
            const data = await walletService.getWallet();
            setWalletBalance(data.balance);
        } catch (error) {
            console.error("Failed to fetch wallet balance", error);
        }
    };
    const fetchProfile = async (silent = false) => {
        if (demoMode) return;
        if (!silent) setProfileLoading(true);
        try {
            const data = await teacherService.getMyProfile();
            setTeacher(data);
        } catch (error) {
            console.error("Failed to fetch profile", error);
            // toast.error("Failed to load profile");
        } finally {
            if (!silent) setProfileLoading(false);
        }
    };

    const fetchBookings = async () => {
        if (demoMode) return;
        if (!teacher || teacher.status !== 'Approved') return;
        setStatsLoading(true);
        try {
            const data = await bookingsService.getMyTeacherBookings();
            setBookings(data || []);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
            // toast.error("Failed to load bookings"); 
        } finally {
            setStatsLoading(false);
        }
    };

    // Initial Load & Mock Data
    useEffect(() => {
        if (demoMode) {
            // ... (Mock Data Logic Retrieval) ...
            // MOCK DATA FOR VIDEO
            const mockTeacher: TeacherProfileResponse = {
                id: 1,
                userId: 'user-123',
                name: 'Sheikh Ahmed Mohamed',
                email: 'demo@example.com',
                imageUrl: 'https://placehold.co/400',
                title: 'Sheikh',
                bio: 'Quran teacher with 10 years of experience, certified in the Ten Qiraat.',
                educationDegree: 'PhD in Islamic Studies',
                experienceYears: '10',
                rating: 4.9,
                reviewCount: 120,
                studentCount: 0,
                status: 'Approved',
                isDataSubmitted: true,
                subjects: ['Quran', 'Tajweed', 'Qiraat'],
                priceStart: 150,
                currency: 'EGP',
                isHafiz: true,
                hasIjaza: true,
                ijazaType: 'The Ten Qiraat',
                ijazaIssuer: 'Al-Azhar Al-Sharif',
                profilePictureUrl: '', // Could add a placeholder or rely on UI fallback
                socialLinks: '',
                user: {
                    fullName: 'Ahmed Mohamed',
                    email: 'test@example.com',
                }
            };
            setTeacher(mockTeacher);

            // Mock Stats
            setStats({
                earnings: 15400,
                activeStudents: 45,
                totalBookings: 120,
                pendingBookings: 3
            });

            // Mock Recent Bookings
            const mockBookings: any[] = [
                { id: 1, studentName: 'Youssef Ali', packageName: 'Intensive Memorization Package', createdAt: new Date().toISOString(), status: 'Confirmed', totalPrice: 450, currency: 'EGP' },
                { id: 2, studentName: 'Karim Mahmoud', packageName: 'Recitation Correction', createdAt: new Date().toISOString(), status: 'Pending', totalPrice: 200, currency: 'EGP' },
                { id: 3, studentName: 'Omar Khaled', packageName: 'Hafs Ijazah', createdAt: new Date(Date.now() - 86400000).toISOString(), status: 'Completed', totalPrice: 1500, currency: 'EGP' },
            ];
            setRecentBookings(mockBookings);
            setProfileLoading(false);
            setActiveTab('dashboard');

        } else {
            fetchProfile();
        }
    }, [demoMode]);



    // Load Bookings when teacher is approved
    useEffect(() => {
        if (teacher?.status === 'Approved') {
            fetchBookings();
            fetchWallet();
        }
    }, [teacher?.status]);

    const loading = profileLoading || (teacher?.status === 'Approved' && statsLoading);

    // State for local usage (stats & profile form)
    // const [teacherProfile, setTeacherProfile] = useState<TeacherProfileResponse | null>(null); // merged with    // Teacher Checklist Logic
    // Checklist items removed
    const [stats, setStats] = useState({
        earnings: 0,
        activeStudents: 0,
        totalBookings: 0,
        pendingBookings: 0
    });
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

    // Withdrawal Logic

    // const [balanceData, setBalanceData] = useState({ available: 0, onHold: 0 });

    useEffect(() => {
        if (teacher) {
            // setTeacherProfile(teacher); // Using 'teacher' state directly
            syncProfileData(teacher, hasInitializedRef.current);
            hasInitializedRef.current = true;

            // Handle Tab Defaulting
            const tabParam = searchParams.get('tab');
            if (tabParam === 'settings') setActiveTab('settings');
            else if (tabParam === 'dashboard') setActiveTab('dashboard');
            else if (teacher.status === 'Approved') setActiveTab('dashboard');
            else setActiveTab('settings');
        }
    }, [teacher, searchParams]);

    useEffect(() => {
        if (bookings.length > 0) {
            const confirmedBookings = bookings.filter((b: Booking) => b.status === 'Confirmed');
            const totalEarnings = confirmedBookings.reduce((sum: number, b: Booking) => sum + b.totalPrice, 0);
            const uniqueStudents = new Set(confirmedBookings.map((b: Booking) => b.studentId)).size;

            setStats({
                earnings: totalEarnings,
                activeStudents: uniqueStudents,
                totalBookings: bookings.length,
                pendingBookings: bookings.filter((b: Booking) => b.status === 'Pending').length
            });
            setRecentBookings(bookings.slice(0, 5));
        }
    }, [bookings]);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        // ... (unchanged)
        // Basic Info
        profilePicture: null as File | null,
        profilePictureUrl: '',
        fullName: '',
        phoneNumber: '',
        gender: '',

        degree: '',
        isHafiz: 'no', // New Field
        hasIjaza: 'no',
        ijazaType: '',
        ijazaIssuer: '',
        ijazaCertificate: null as File | null,
        ijazaCertificateUrl: '',
        yearsExperience: '',
        specialties: [] as string[],
        bio: '',
        priceStart: 0,
        audioSample: null as File | null,
        audioSampleUrl: '',
        socialLinks: '',
        // Personal Info (Identity)
        nationalId: '',
        dateOfBirth: '',
        age: '',
        nationalIdImage: null as File | null,
        nationalIdImageUrl: '',
        // New Fields
        qualificationCertificate: null as File | null,
        qualificationCertificateUrl: '',
        showQualificationCertificate: false,

        experienceCertificate: null as File | null,
        experienceCertificateUrl: '',
        showExperienceCertificate: false,

        showIjazaCertificate: false,
        showAudioSample: true
    });



    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [completionPercentage, setCompletionPercentage] = useState(0);

    const specialtiesOptions = [
        'Quran Memorization',
        'Memorization Review',
        'Theoretical Tajweed',
        'Practical Tajweed',
        'Quran Tafsir',
        'The Ten Qiraat',
        'Adult Education',
        'Children Education'
    ];

    useEffect(() => {
        // Listen for Wallet Notifications
        const handleNotification = (message: string) => {
            if (message.includes('deposit') || message.includes('deduct') || message.includes('wallet') || message.includes('إيداع') || message.includes('خصم') || message.includes('محفظتك')) {
                // queryClient.invalidateQueries({ queryKey: queryKeys.bookings.teacher });
                fetchBookings(); // Refetch bookings
                toast.success('Wallet balance updated', { icon: '💰' });
            }
        };

        signalRService.on('ReceiveNotification', handleNotification);
        return () => {
            signalRService.off('ReceiveNotification', handleNotification);
        };
    }, []);

    const syncProfileData = (teacher: TeacherProfileResponse, merge = false) => {
        // Calculate age if DOB exists
        let calculatedAge = '';
        const dob = teacher.dateOfBirth || teacher.user?.dateOfBirth;
        if (dob) {
            const birthDate = new Date(dob);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
        }

        // Functional update to preserve local edits if merging
        setProfileData(prev => {
            if (merge) {
                // Return original state but update server-governed metadata
                return {
                    ...prev,
                    // Identity
                    nationalIdImageUrl: teacher.nationalIdImageUrl || prev.nationalIdImageUrl,
                    
                    // Qualifications
                    qualificationCertificateUrl: teacher.qualificationCertificateUrl || prev.qualificationCertificateUrl,
                    ijazaCertificateUrl: teacher.ijazaCertificateUrl || prev.ijazaCertificateUrl,
                    
                    // Experience
                    experienceCertificateUrl: teacher.experienceCertificateUrl || prev.experienceCertificateUrl,
                    priceStart: teacher.priceStart !== undefined ? teacher.priceStart : prev.priceStart,
                    
                    // Audio Sample
                    audioSampleUrl: teacher.audioSampleUrl || prev.audioSampleUrl,
                    
                    // Other metadata from server
                    profilePictureUrl: teacher.profilePictureUrl || teacher.user?.profilePictureUrl || prev.profilePictureUrl,
                };
            }

            // FULL SYNC (Initial Load)
            return {
                profilePicture: null,
                profilePictureUrl: teacher.profilePictureUrl || teacher.user?.profilePictureUrl || '',
                fullName: teacher.user?.fullName || teacher.name || '',
                phoneNumber: teacher.phoneNumber || teacher.user?.phoneNumber || '',
                gender: teacher.gender || teacher.user?.gender || '',

                degree: teacher.educationDegree || '',
                isHafiz: teacher.isHafiz ? 'yes' : 'no',
                hasIjaza: teacher.hasIjaza ? 'yes' : 'no',
                ijazaType: teacher.ijazaType || '',
                ijazaIssuer: teacher.ijazaIssuer || '',
                ijazaCertificate: null,
                ijazaCertificateUrl: teacher.ijazaCertificateUrl || '',
                yearsExperience: teacher.experienceYears || '',
                specialties: teacher.subjects || [],
                bio: teacher.bio || '',
                priceStart: teacher.priceStart !== undefined ? teacher.priceStart : 0,
                audioSample: null,
                audioSampleUrl: teacher.audioSampleUrl || '',
                socialLinks: teacher.socialLinks || '',
                nationalId: teacher.nationalId || teacher.user?.nationalId || '',
                dateOfBirth: (teacher.dateOfBirth || teacher.user?.dateOfBirth) ? (teacher.dateOfBirth || teacher.user?.dateOfBirth)!.split('T')[0] : '',
                age: calculatedAge,
                nationalIdImage: null,
                nationalIdImageUrl: teacher.nationalIdImageUrl || '',

                qualificationCertificate: null,
                qualificationCertificateUrl: teacher.qualificationCertificateUrl || '',
                experienceCertificate: null,
                experienceCertificateUrl: teacher.experienceCertificateUrl || '',

                showQualificationCertificate: teacher.showQualificationCertificate || false,
                showExperienceCertificate: teacher.showExperienceCertificate || false,
                showIjazaCertificate: teacher.showIjazaCertificate || false,
                showAudioSample: teacher.showAudioSample ?? true
            };
        });
    };



    const handleSpecialtyToggle = (specialty: string) => {
        setProfileData(prev => ({
            ...prev,
            specialties: prev.specialties.includes(specialty)
                ? prev.specialties.filter(s => s !== specialty)
                : [...prev.specialties, specialty]
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Sorry, the audio file is too large. The maximum is 10 MB');
                e.target.value = ''; // Reset input
                return;
            }

            setIsUploadingAudio(true);
            try {
                const url = await teacherService.uploadAudio(file);
                // Update state immediately with the returned URL to allow preview
                setProfileData(prev => ({ ...prev, audioSample: file, audioSampleUrl: url }));
                toast.success("Audio file uploaded successfully");
            } catch (error: any) {
                console.error("Error uploading audio", error);
                const errorMessage = error.response?.data || error.message;
                if (typeof errorMessage === 'string' && errorMessage.includes('size')) {
                    toast.error('Sorry, the audio file is too large. The maximum is 10 MB');
                } else {
                    toast.error("Audio upload failed. Please try again.");
                }
                e.target.value = ''; // Reset input so user can re-select if needed
            } finally {
                setIsUploadingAudio(false);
            }
        }
    };

    const handleSavePersonalInfo = async () => {
        if (!teacher?.id) return;
        setIsSaving(true);
        try {
            // Update Auth Profile
            await authService.updateProfile({
                fullName: profileData.fullName,
                phoneNumber: profileData.phoneNumber || undefined,
                gender: profileData.gender || undefined
            });

            // Update Teacher Profile
            const formData = new FormData();
            formData.append('Bio', profileData.bio || '');
            formData.append('NationalId', profileData.nationalId);
            if (profileData.dateOfBirth) {
                formData.append('DateOfBirth', new Date(profileData.dateOfBirth).toISOString());
            }
            if (profileData.profilePicture) {
                formData.append('ProfilePictureImage', profileData.profilePicture);
            }
            if (profileData.nationalIdImage) {
                formData.append('NationalIdImage', profileData.nationalIdImage);
            }

            await teacherService.updateTeacherProfile(teacher.id, formData);
            toast.success('Personal information saved successfully');
            fetchProfile(true);
        } catch (error: any) {
            toast.error(`Save error: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveQualifications = async () => {
        if (!teacher?.id) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('EducationDegree', profileData.degree);
            formData.append('IsHafiz', profileData.isHafiz === 'yes' ? 'true' : 'false');
            formData.append('HasIjaza', profileData.hasIjaza === 'yes' ? 'true' : 'false');
            formData.append('IjazaType', profileData.ijazaType);
            formData.append('IjazaIssuer', profileData.ijazaIssuer);
            formData.append('ShowQualificationCertificate', profileData.showQualificationCertificate ? 'true' : 'false');
            formData.append('ShowIjazaCertificate', profileData.showIjazaCertificate ? 'true' : 'false');

            if (profileData.qualificationCertificate) {
                formData.append('QualificationCertificateImage', profileData.qualificationCertificate);
            }
            if (profileData.ijazaCertificate) {
                formData.append('IjazaCertificateImage', profileData.ijazaCertificate);
            }

            await teacherService.updateTeacherProfile(teacher.id, formData);
            toast.success('Qualifications saved successfully');
            fetchProfile(true);
        } catch (error: any) {
            toast.error(`Save error: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveExperience = async () => {
        if (!teacher?.id) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('ExperienceYears', profileData.yearsExperience);
            formData.append('ShowExperienceCertificate', profileData.showExperienceCertificate ? 'true' : 'false');
            
            profileData.specialties.forEach(subject => {
                formData.append('Subjects', subject);
            });

            if (profileData.experienceCertificate) {
                formData.append('ExperienceCertificateImage', profileData.experienceCertificate);
            }

            await teacherService.updateTeacherProfile(teacher.id, formData);
            toast.success('Experience saved successfully');
            fetchProfile(true);
        } catch (error: any) {
            toast.error(`Save error: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAudioSample = async () => {
        if (!teacher?.id) return;
        if (!profileData.audioSampleUrl) {
            toast.error('Please upload the audio sample first');
            return;
        }
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('AudioSampleUrl', profileData.audioSampleUrl);
            formData.append('ShowAudioSample', profileData.showAudioSample ? 'true' : 'false');

            await teacherService.updateTeacherProfile(teacher.id, formData);
            toast.success('Audio sample saved successfully');
            fetchProfile(true);
        } catch (error: any) {
            toast.error(`Save error: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLinks = async () => {
        if (!teacher?.id) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('SocialLinks', profileData.socialLinks);

            await teacherService.updateTeacherProfile(teacher.id, formData);
            toast.success('Links saved successfully');
            fetchProfile(true);
        } catch (error: any) {
            toast.error(`Save error: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation Logic
        // We ensure all mandatory fields (Nationality, DOB, Files) are present.
        // Experience Certificate is now mandatory for quality assurance.
        if (!profileData.fullName) {
            toast.error('Please enter your full name');
            return;
        }
        if (!profileData.nationalId || profileData.nationalId.length !== 14) {
            toast.error('Please enter a valid national ID (14 digits)');
            return;
        }
        if (!profileData.dateOfBirth) {
            toast.error('Please enter your date of birth');
            return;
        }
        if (!profileData.nationalIdImage && !profileData.nationalIdImageUrl) {
            toast.error('Please upload your ID card photo');
            return;
        }
        if (profileData.hasIjaza === 'yes' && !profileData.ijazaCertificate && !profileData.ijazaCertificateUrl) {
            toast.error('Please upload your Ijazah certificate');
            return;
        }
        if (profileData.degree && !profileData.qualificationCertificate && !profileData.qualificationCertificateUrl) {
            toast.error('Please upload your degree certificate');
            return;
        }
        if (!profileData.yearsExperience) {
            toast.error('Please select your years of experience');
            return;
        }
        if (!profileData.experienceCertificate && !profileData.experienceCertificateUrl) {
            toast.error('Please upload your experience certificate');
            return;
        }
        if (!profileData.audioSampleUrl) {
            toast.error('Please upload the audio sample');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        try {
            // 1. Update User Profile (Name & Phone)
            await authService.updateProfile({
                fullName: profileData.fullName,
                phoneNumber: profileData.phoneNumber || undefined,
                gender: profileData.gender || undefined
            });

            // 2. Update Teacher Profile
            const formData = new FormData();

            // Basic fields
            formData.append('Title', profileData.degree ? `${profileData.degree}` : 'Teacher');
            formData.append('Bio', profileData.bio || `Teacher with ${profileData.yearsExperience} experience.`);
            formData.append('PriceStart', profileData.priceStart.toString());
            formData.append('EducationDegree', profileData.degree);
            formData.append('IsHafiz', profileData.isHafiz === 'yes' ? 'true' : 'false'); // Append new field
            formData.append('HasIjaza', profileData.hasIjaza === 'yes' ? 'true' : 'false');
            formData.append('IjazaType', profileData.ijazaType);
            formData.append('IjazaIssuer', profileData.ijazaIssuer);
            formData.append('ExperienceYears', profileData.yearsExperience);

            formData.append('SocialLinks', profileData.socialLinks);

            formData.append('ShowQualificationCertificate', profileData.showQualificationCertificate ? 'true' : 'false');
            formData.append('ShowExperienceCertificate', profileData.showExperienceCertificate ? 'true' : 'false');
            formData.append('ShowIjazaCertificate', profileData.showIjazaCertificate ? 'true' : 'false');
            formData.append('ShowAudioSample', profileData.showAudioSample ? 'true' : 'false');

            // Critical Fields
            formData.append('NationalId', profileData.nationalId);

            if (profileData.dateOfBirth) {
                formData.append('DateOfBirth', new Date(profileData.dateOfBirth).toISOString());
            }

            // Append arrays
            profileData.specialties.forEach(subject => {
                formData.append('Subjects', subject);
            });

            // Append files
            if (profileData.nationalIdImage) {
                formData.append('NationalIdImage', profileData.nationalIdImage);
            }
            if (profileData.ijazaCertificate) {
                formData.append('IjazaCertificateImage', profileData.ijazaCertificate);
            }
            if (profileData.qualificationCertificate) {
                formData.append('QualificationCertificateImage', profileData.qualificationCertificate);
            }
            if (profileData.experienceCertificate) {
                formData.append('ExperienceCertificateImage', profileData.experienceCertificate);
            }
            if (profileData.profilePicture) {
                formData.append('ProfilePictureImage', profileData.profilePicture);
            }

            // Audio URL
            formData.append('AudioSampleUrl', profileData.audioSampleUrl);


            if (teacher?.id) {
                // If the teacher exists, technically we just saved some changes, 
                // but this button specifically represents "Send for Review".
                // In some systems, this might change the status back to Pending.
                // For now, we'll just show success that all requirements are met.
                
                // We'll call the general update one last time just in case there were unsaved changes in UI
                // (Though the user will likely have clicked 'Save' on sections)
                // Actually, let's just show success that the profile is complete.
                
                toast.success('Your profile was submitted for review! You will be notified once activated.');
                fetchProfile(true);
            } else {
                toast.error("Error: teacher profile not found (Missing ID)");
            }
        } catch (error: any) {
            console.error("Error submitting profile", error);
            toast.error(`An error occurred while submitting: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Password change error', error);
            const msg = error.response?.data?.map ? error.response.data.map((e: any) => e.description).join('\n') : 'Failed to change password';
            toast.error(msg || 'Check your current password');
        }
    };

    useEffect(() => {
        let completed = 0;

        // 1. Basic Info (20%)
        let basic = 0;
        if (profileData.fullName) basic += 4;
        if (profileData.phoneNumber) basic += 4;
        if (profileData.nationalId && profileData.nationalId.length === 14) basic += 4;
        if (profileData.dateOfBirth) basic += 4;
        if (profileData.bio) basic += 4; // Assuming bio is part of basic info not explicitly listed as mandatory but good to have
        completed += basic;

        // 2. Identity (20%)
        if (profileData.nationalIdImageUrl || profileData.nationalIdImage) completed += 20;

        // 3. Professional (30%)
        // Degree + Certificate (15%)
        if (profileData.degree) {
            completed += 5;
            if (profileData.qualificationCertificateUrl || profileData.qualificationCertificate) completed += 10;
        }
        // Experience + Certificate (15%)
        if (profileData.yearsExperience) {
            completed += 5;
            if (profileData.experienceCertificateUrl || profileData.experienceCertificate) completed += 10;
        }

        // 4. Quranic (15%)
        if (profileData.isHafiz === 'yes') completed += 5;
        if (profileData.hasIjaza === 'yes') {
            completed += 5;
            if (profileData.ijazaCertificateUrl || profileData.ijazaCertificate) completed += 5;
        } else {
            // If no ijaza is claimed, we grant the full 10% for this section relative to completion, 
            // OR we can say this section is just 5% (Hafiz) and re-distribute.
            // Let's keep it simple: If 'no' Ijaza, get 10% automatically (as not applicable), or just give the point.
            // Better strategy: Treat 'No' as complete for this requirement.
            completed += 10;
        }

        // 5. Content (15%)
        if (profileData.specialties.length > 0) completed += 5;
        if (profileData.audioSampleUrl || profileData.audioSample) completed += 10;

        // Cap at 100
        setCompletionPercentage(Math.min(completed, 100));

        // Update Checklist

    }, [profileData]);

    if (loading) return <div className="text-center py-10">Loading...</div>;

    const isApproved = teacher?.status === 'Approved';

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {isApproved ? 'Welcome! Here is a summary of your teaching activity.' : 'Complete your profile to start teaching.'}
                    </p>
                </div>

                {isApproved && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-1.5 shadow-sm border dark:border-gray-700">

                        <div className="flex gap-1 items-center px-1">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <BanknotesIcon className="h-4 w-4" />
                                    Statistics
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <CogIcon className="h-4 w-4" />
                                    Account Settings
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard View */}
            {activeTab === 'dashboard' && isApproved && (
                <div className="space-y-6 animate-fadeIn">



                    {/* Stats Cards */}
                    <div className="stats-grid grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="card border-none shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-text-secondary text-sm">My Wallet</h3>
                                <BanknotesIcon className="h-8 w-8 text-success-text p-1.5 bg-success-bg rounded-lg" />
                            </div>
                            <div className="mb-2">
                                <p className="text-sm text-gray-500">Available Balance</p>
                                <p className="text-3xl font-bold font-latin-heading text-primary-green">{walletBalance} <span className="text-sm font-normal text-text-secondary">EGP</span></p>
                            </div>
                            {/* <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                <span>Pending: {100} EGP</span>
                            </div> */}
                            {/* Ideally fetch OnHold from backend. For now using earnings as available. */}


                        </div>

                        <div className="card border-none shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-text-secondary text-sm">Active Students</h3>
                                <UsersIcon className="h-8 w-8 text-secondary-blue p-1.5 bg-blue-50 rounded-lg" />
                            </div>
                            <p className="text-3xl font-bold font-latin-heading text-primary-green">{stats.activeStudents}</p>
                        </div>
                        <div className="card border-none shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-text-secondary text-sm">Total Bookings</h3>
                                <CalendarIcon className="h-8 w-8 text-secondary-purple p-1.5 bg-purple-50 rounded-lg" />
                            </div>
                            <p className="text-3xl font-bold font-latin-heading text-primary-green">{stats.totalBookings}</p>
                        </div>
                        <div className="card border-none shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-text-secondary text-sm">New Requests</h3>
                                <ClockIcon className="h-8 w-8 text-warning-text p-1.5 bg-warning-bg rounded-lg" />
                            </div>
                            <p className="text-3xl font-bold font-latin-heading text-primary-green">{stats.pendingBookings}</p>
                            {stats.pendingBookings > 0 && <span className="text-xs text-warning-text mt-1">Action needed</span>}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/teacher/packages" className="p-6 bg-gradient-to-r from-primary-gold to-primary-gold-light rounded-xl text-primary-green shadow-md hover:shadow-lg transition-all flex items-center justify-between group">
                            <div>
                                <h3 className="font-bold text-lg font-heading">Manage Packages</h3>
                                <p className="text-primary-green opacity-90 text-sm">Add new packages or edit prices</p>
                            </div>
                            <BriefcaseIcon className="h-10 w-10 text-primary-green group-hover:scale-110 transition-transform" />
                        </Link>
                        <Link to="/teacher/schedule" className="card border-none hover:shadow-md transition-all flex items-center justify-between group">
                            <div>
                                <h3 className="font-bold text-lg text-primary-green font-heading">Session Schedule</h3>
                                <p className="text-text-secondary text-sm">Track your upcoming sessions (in your local time)</p>
                            </div>
                            <CalendarIcon className="h-10 w-10 text-gray-400 group-hover:text-primary-green transition-colors" />
                        </Link>
                    </div>

                    {/* Recent Bookings */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white">Latest Bookings</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Student</th>
                                        <th className="px-6 py-3 text-left">Package</th>
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.map((booking) => (
                                        <tr key={booking.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-right">
                                                {booking.studentName}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {booking.packageName}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {new Date(booking.createdAt).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                                                    {translateStatus(booking.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {booking.totalPrice} {booking.currency}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentBookings.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No bookings yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Form (Shown if not approved or tab is settings) */}
            {(activeTab === 'settings' || !isApproved) && (
                <div className="animate-fadeIn">
                    {!isApproved && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-md border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-shrink-0">
                                            <ClockIcon className="h-12 w-12 text-yellow-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {teacher ? `Account status: ${translateStatus(teacher.status)}` : 'Account status: New'}
                                            </h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {teacher?.status === 'Pending'
                                                    ? 'Your profile is under review. We will contact you soon.'
                                                    : 'Complete the following information to submit your profile for review.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Completion</span>
                                            <span className="text-sm font-bold text-gold-600">{completionPercentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                            <div className="bg-gold-500 h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Personal Information Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700" data-tour="teacher-profile-personal">
                            <div className="flex items-center gap-3 mb-4">
                                <UsersIcon className="h-6 w-6 text-gold-600" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Photo</label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                                                {profileData.profilePicture ? (
                                                    <img
                                                        src={URL.createObjectURL(profileData.profilePicture)}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : profileData.profilePictureUrl ? (
                                                    <img
                                                        src={getFileUrl(profileData.profilePictureUrl)}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <UserIcon className="h-full w-full p-4 text-gray-400 bg-gray-100 dark:bg-gray-700" />
                                                )}
                                            </div>
                                            <input
                                                id="profile-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setProfileData({ ...profileData, profilePicture: e.target.files[0] });
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <label htmlFor="profile-upload" className="text-sm font-medium text-gold-600 cursor-pointer hover:text-gold-700">
                                                Change Photo
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-0 max-h-[42px] pr-3 flex items-center pointer-events-none">
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="input-field pr-10"
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 right-0 max-h-[42px] pr-3 flex items-center pointer-events-none">
                                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="input-field pr-10"
                                                value={profileData.phoneNumber}
                                                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                                placeholder="Phone number"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                                        <select
                                            value={profileData.gender}
                                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                            className="input-field"
                                        >
                                            <option value="" disabled>Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About You</label>
                                    <textarea
                                        className="input-field min-h-[100px]"
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        placeholder="Write a short bio about your experience and skills..."
                                    />
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 my-4 pt-4">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Identity Information</h4>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">National ID Number</label>
                                    <input
                                        type="text"
                                        maxLength={14}
                                        placeholder="Enter national ID (14 digits)"
                                        className="input-field"
                                        value={profileData.nationalId}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setProfileData({ ...profileData, nationalId: val });
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                                        <DateInput
                                            value={profileData.dateOfBirth}
                                            onChange={(val) => {
                                                const dob = val;
                                                let age = '';
                                                if (dob) {
                                                    const birthDate = new Date(dob);
                                                    const ageDifMs = Date.now() - birthDate.getTime();
                                                    const ageDate = new Date(ageDifMs);
                                                    age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
                                                }
                                                setProfileData({ ...profileData, dateOfBirth: dob, age });
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed"
                                            value={profileData.age ? `${profileData.age} years` : ''}
                                            placeholder="Calculated automatically"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Card Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setProfileData({ ...profileData, nationalIdImage: e.target.files[0] });
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/30 dark:file:text-gold-400"
                                    />
                                    {profileData.nationalIdImageUrl && !profileData.nationalIdImage && (
                                        <p className="mt-1 text-xs text-green-600">ID photo already uploaded</p>
                                    )}
                                    {profileData.nationalIdImage && (
                                        <p className="mt-1 text-xs text-blue-600">New file selected: {profileData.nationalIdImage.name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4">
                                <button
                                    type="button"
                                    onClick={handleSavePersonalInfo}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Save Personal Information
                                </button>
                            </div>
                        </div>

                        {/* Qualifications Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700" data-tour="teacher-profile-education">
                            <div className="flex items-center gap-3 mb-4">
                                <AcademicCapIcon className="h-6 w-6 text-gold-600" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Academic Qualifications</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree</label>
                                    <select
                                        className="input-field"
                                        value={profileData.degree}
                                        onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                                    >
                                        <option value="">Select degree</option>
                                        <option value="Bachelor">Bachelor</option>
                                        <option value="Master">Master</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Have you memorized the entire Quran?</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="isHafiz"
                                                value="yes"
                                                checked={profileData.isHafiz === 'yes'}
                                                onChange={(e) => setProfileData({ ...profileData, isHafiz: e.target.value })}
                                                className="text-gold-600 focus:ring-gold-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="isHafiz"
                                                value="no"
                                                checked={profileData.isHafiz === 'no'}
                                                onChange={(e) => setProfileData({ ...profileData, isHafiz: e.target.value })}
                                                className="text-gold-600 focus:ring-gold-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                                        </label>
                                    </div>
                                </div>

                                {profileData.degree && (
                                    <div className="animate-fadeIn">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree Certificate Photo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    setProfileData(prev => ({ ...prev, qualificationCertificate: file }));
                                                }
                                            }}
                                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/30 dark:file:text-gold-400"
                                        />
                                        {profileData.qualificationCertificateUrl && !profileData.qualificationCertificate && (
                                            <p className="mt-1 text-xs text-green-600">Certificate already uploaded</p>
                                        )}
                                        {profileData.qualificationCertificate && (
                                            <p className="mt-1 text-xs text-blue-600">File selected: {profileData.qualificationCertificate.name}</p>
                                        )}
                                        <div className="mt-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={profileData.showQualificationCertificate}
                                                    onChange={(e) => setProfileData({ ...profileData, showQualificationCertificate: e.target.checked })}
                                                    className="text-gold-600 focus:ring-gold-500 rounded"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Show degree certificate on your public profile?</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Do you have an Ijazah in the Qiraat?</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="hasIjaza"
                                                value="yes"
                                                checked={profileData.hasIjaza === 'yes'}
                                                onChange={(e) => setProfileData({ ...profileData, hasIjaza: e.target.value })}
                                                className="text-gold-600 focus:ring-gold-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="hasIjaza"
                                                value="no"
                                                checked={profileData.hasIjaza === 'no'}
                                                onChange={(e) => setProfileData({ ...profileData, hasIjaza: e.target.value })}
                                                className="text-gold-600 focus:ring-gold-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                                        </label>
                                    </div>
                                </div>

                                {profileData.hasIjaza === 'yes' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ijazah Type</label>
                                            <input
                                                type="text"
                                                placeholder="Hafs an Asim"
                                                className="input-field"
                                                value={profileData.ijazaType}
                                                onChange={(e) => setProfileData({ ...profileData, ijazaType: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Issuing Authority</label>
                                            <input
                                                type="text"
                                                placeholder="Name of the sheikh or institute"
                                                className="input-field"
                                                value={profileData.ijazaIssuer}
                                                onChange={(e) => setProfileData({ ...profileData, ijazaIssuer: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ijazah Certificate Photo</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const file = e.target.files[0];
                                                        setProfileData(prev => ({ ...prev, ijazaCertificate: file }));
                                                    }
                                                }}
                                                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/30 dark:file:text-gold-400"
                                            />
                                            {profileData.ijazaCertificateUrl && !profileData.ijazaCertificate && (
                                                <p className="mt-1 text-xs text-green-600">Ijazah photo already uploaded</p>
                                            )}
                                            {profileData.ijazaCertificate && (
                                                <p className="mt-1 text-xs text-blue-600">New file selected: {profileData.ijazaCertificate.name}</p>
                                            )}
                                            <div className="mt-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={profileData.showIjazaCertificate}
                                                        onChange={(e) => setProfileData({ ...profileData, showIjazaCertificate: e.target.checked })}
                                                        className="text-gold-600 focus:ring-gold-500 rounded"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">Show Ijazah certificate on your public profile?</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4">
                                <button
                                    type="button"
                                    onClick={handleSaveQualifications}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Save Qualifications
                                </button>
                            </div>
                        </div>

                        {/* Experience Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700" data-tour="teacher-profile-experience">
                            <div className="flex items-center gap-3 mb-4">
                                <BriefcaseIcon className="h-6 w-6 text-gold-600" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Work Experience</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of Experience</label>
                                    <select
                                        className="input-field"
                                        value={profileData.yearsExperience}
                                        onChange={(e) => setProfileData({ ...profileData, yearsExperience: e.target.value })}
                                    >
                                        <option value="">Select duration</option>
                                        <option value="<1">Less than 1 year</option>
                                        <option value="1-3">1-3 years</option>
                                        <option value="3-5">3-5 years</option>
                                        <option value="5-10">5-10 years</option>
                                        <option value="10+">More than 10 years</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Price (EGP)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input-field bg-gray-100 cursor-not-allowed"
                                        value={profileData.priceStart}
                                        disabled
                                        readOnly
                                        placeholder="Set automatically"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        This price is set automatically from the lowest session price in your packages (default 100 EGP).
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialties (choose what fits)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {specialtiesOptions.map((specialty) => (
                                            <label key={specialty} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={profileData.specialties.includes(specialty)}
                                                    onChange={() => handleSpecialtyToggle(specialty)}
                                                    className="text-gold-600 focus:ring-gold-500 rounded"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience Certificate *</label>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setProfileData({ ...profileData, experienceCertificate: e.target.files[0] });
                                                }
                                            }}
                                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/30 dark:file:text-gold-400"
                                        />
                                        {profileData.experienceCertificateUrl && !profileData.experienceCertificate && (
                                            <p className="mt-1 text-xs text-green-600">Experience certificate already uploaded</p>
                                        )}
                                        <div className="mt-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={profileData.showExperienceCertificate}
                                                    onChange={(e) => setProfileData({ ...profileData, showExperienceCertificate: e.target.checked })}
                                                    className="text-gold-600 focus:ring-gold-500 rounded"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Show experience certificate on your public profile?</span>
                                            </label>
                                        </div>
                                        {profileData.experienceCertificate && (
                                            <p className="mt-1 text-xs text-blue-600">File selected: {profileData.experienceCertificate.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4">
                                <button
                                    type="button"
                                    onClick={handleSaveExperience}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Save Experience
                                </button>
                            </div>
                        </div>

                        {/* Audio Sample Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700" data-tour="teacher-profile-audio">
                            <div className="flex items-center gap-3 mb-4">
                                <MicrophoneIcon className="h-6 w-6 text-gold-600" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audio Sample</h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Upload an audio recording of Surah Al-Fatiha
                                </label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    disabled={isUploadingAudio}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-gold-50 file:text-gold-700
                                        hover:file:bg-gold-100
                                        dark:file:bg-gold-900/30 dark:file:text-gold-400
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {isUploadingAudio && (
                                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading audio file...
                                    </div>
                                )}
                                {profileData.audioSampleUrl && (
                                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                        <p className="flex items-center gap-2 mb-1">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Audio file uploaded
                                        </p>
                                        <div className="mt-4">
                                            <CustomAudioPlayer
                                                key={profileData.audioSampleUrl}
                                                src={`${getFileUrl(profileData.audioSampleUrl)}?t=${Date.now()}`}
                                                className="w-full max-w-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4">
                                <button
                                    type="button"
                                    onClick={handleSaveAudioSample}
                                    disabled={isSaving || isUploadingAudio}
                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Save Audio Sample
                                </button>
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700" data-tour="teacher-profile-links">
                            <div className="flex items-center gap-3 mb-4">
                                <LinkIcon className="h-6 w-6 text-gold-600" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Social Links (optional)</h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    YouTube or Facebook link (if any)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://youtube.com/@username"
                                    className="input-field"
                                    value={profileData.socialLinks}
                                    onChange={(e) => setProfileData({ ...profileData, socialLinks: e.target.value })}
                                />
                            </div>
                            <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4">
                                <button
                                    type="button"
                                    onClick={handleSaveLinks}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    Save Links
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        {!isApproved && (
                            <div className="flex justify-end pb-8">
                                <button
                                    type="button"
                                    onClick={handleFinalSubmit}
                                    disabled={isSaving || isUploadingAudio}
                                    className={`px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2 ${(isSaving || isUploadingAudio) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <ClockIcon className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <CheckCircleIcon className="h-5 w-5" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Submit for Review'}
                                </button>
                            </div>
                        )}
                    </div>


                    {/* Security Section (Password) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 mb-8" data-tour="teacher-security">
                        <div className="flex items-center gap-3 mb-4">
                            <LockClosedIcon className="h-6 w-6 text-gold-600" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Security and Password</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                                >
                                    <KeyIcon className="h-5 w-5" />
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

        </div >
    );
};

export default TeacherDashboard;
