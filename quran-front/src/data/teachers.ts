export interface Teacher {
    id: number;
    name: string;
    title: string; // e.g. Hafiz, Sheikh
    subjects: string[];
    rating: number;
    reviewCount: number;
    priceStart: number; // Starting price for packages
    currency: string;
    imageUrl: string;
    bio: string;
}

export const mockTeachers: Teacher[] = [
    {
        id: 1,
        name: "Sheikh Ahmed Mohamed",
        title: "Reciter certified in the Ten Qiraat",
        subjects: ["Quran", "Tajweed", "Qiraat"],
        rating: 4.9,
        reviewCount: 120,
        priceStart: 150,
        currency: "EGP", // EGP
        imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "15 years of experience teaching Quran memorization and granting Ijazas with connected chains."
    },
    {
        id: 2,
        name: "Sheikha Fatima Al-Zahraa",
        title: "Hafiza with Ijaza",
        subjects: ["Quran", "Tafsir", "Children"],
        rating: 5.0,
        reviewCount: 85,
        priceStart: 100,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "Specializes in teaching children and women in an easy, engaging style."
    },
    {
        id: 3,
        name: "Dr. Omar Abdullah",
        title: "PhD in Comparative Fiqh",
        subjects: ["Fiqh", "Aqeedah", "Hadith"],
        rating: 4.8,
        reviewCount: 210,
        priceStart: 200,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "Explains Fiqh and Hadith books in a simplified academic style for students of knowledge."
    },
    {
        id: 4,
        name: "Sheikh Youssef Ali",
        title: "Imam and Quran teacher",
        subjects: ["Quran", "Noorani Qaida"],
        rating: 4.7,
        reviewCount: 50,
        priceStart: 80,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "Builds children's foundations in Arabic reading and Quran with the Noorani Qaida."
    },
    {
        id: 5,
        name: "Sheikha Aisha",
        title: "Tajweed Teacher",
        subjects: ["Tajweed", "Recitation Correction"],
        rating: 4.9,
        reviewCount: 154,
        priceStart: 120,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "Intensive theoretical and practical Tajweed courses for women."
    }
];
