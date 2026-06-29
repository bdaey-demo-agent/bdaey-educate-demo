export interface Teacher {
    id: number;
    userId: string;
    name: string;
    userName?: string;
    email: string;
    profilePictureUrl?: string;
    imageUrl: string;
    title: string;
    subjects: string[];
    bio: string;
    priceStart: number;
    currency: string;
    rating: number;
    reviewCount: number;
    studentCount: number;
    phoneNumber?: string;
    minPackagePrice?: number;
    effectivePackageDeletionPenalty?: number;

    // New fields
    educationDegree: string;
    isHafiz: boolean; // Add this
    hasIjaza: boolean;
    ijazaType?: string;
    ijazaIssuer?: string;
    experienceYears: string;
    audioSampleUrl?: string;
    showAudioSample?: boolean;
    socialLinks?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    nationalIdImageUrl?: string;
    ijazaCertificateUrl?: string;
    qualificationCertificateUrl?: string;
    experienceCertificateUrl?: string;

    showQualificationCertificate?: boolean;
    showExperienceCertificate?: boolean;
    showIjazaCertificate?: boolean;

    // Order
    profileSectionsOrder?: string[];

    // Flattened fields from Backend (ApplicationUser)
    nationalId?: string;
    dateOfBirth?: string;
    gender?: string;
    isOnline?: boolean;
    isDataSubmitted: boolean;

    user?: {
        email: string;
        fullName: string;
        userName?: string;
        phoneNumber?: string;
        profilePictureUrl?: string;
        // Deprecated: nationalId and dateOfBirth are now at root
        nationalId?: string;
        dateOfBirth?: string;
        gender?: string;
    };
}

export interface CreateTeacherProfileDto {
    title: string;
    subjects: string[];
    bio: string;
    priceStart: number;
    currency?: string;

    educationDegree: string;
    hasIjaza: boolean;
    ijazaType?: string;
    ijazaIssuer?: string;
    experienceYears: string;
    socialLinks?: string;
}

export interface UpdateTeacherProfileDto {
    title?: string;
    subjects?: string[];
    bio?: string;
    priceStart?: number;
    currency?: string;

    educationDegree?: string;
    hasIjaza?: boolean;
    isHafiz?: boolean;
    ijazaType?: string;
    ijazaIssuer?: string;
    experienceYears?: string;
    socialLinks?: string;
    showAudioSample?: boolean;
}

// Alias for API response
export type TeacherProfileResponse = Teacher;
