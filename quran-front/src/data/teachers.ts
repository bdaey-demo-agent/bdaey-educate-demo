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
        name: "الشيخ أحمد محمد",
        title: "مقرئ بالقراءات العشر",
        subjects: ["قرآن كريم", "تجويد", "قراءات"],
        rating: 4.9,
        reviewCount: 120,
        priceStart: 150,
        currency: "EGP", // EGP
        imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "خبرة 15 عاماً في تحفيظ القرآن الكريم ومنح الإجازات بالسند المتصل."
    },
    {
        id: 2,
        name: "الشيخة فاطمة الزهراء",
        title: "حافظة ومجازة",
        subjects: ["قرآن كريم", "تفسير", "أطفال"],
        rating: 5.0,
        reviewCount: 85,
        priceStart: 100,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "متخصصة في تعليم الأطفال والنساء، بأسلوب ميسر وشيق."
    },
    {
        id: 3,
        name: "د. عمر عبد الله",
        title: "دكتوراه في الفقه المقارن",
        subjects: ["فقه", "عقيدة", "حديث"],
        rating: 4.8,
        reviewCount: 210,
        priceStart: 200,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "شرح كتب الفقه والحديث بأسلوب أكاديمي مبسط لطلاب العلم."
    },
    {
        id: 4,
        name: "الشيخ يوسف علي",
        title: "إمام ومحفظ",
        subjects: ["قرآن كريم", "قاعدة نورانية"],
        rating: 4.7,
        reviewCount: 50,
        priceStart: 80,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "تأسيس الأطفال في القراءة العربية والقرآن الكريم بالقاعدة النورانية."
    },
    {
        id: 5,
        name: "الشيخة عائشة",
        title: "معلمة تجويد",
        subjects: ["تجويد", "تصحيح تلاوة"],
        rating: 4.9,
        reviewCount: 154,
        priceStart: 120,
        currency: "EGP",
        imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
        bio: "دورات مكثفة في التجويد النظري والعملي للنساء."
    }
];
