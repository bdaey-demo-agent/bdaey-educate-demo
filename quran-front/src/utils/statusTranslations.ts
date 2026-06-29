
export const translateStatus = (status: string): string => {
    const map: Record<string, string> = {
        // General / Booking
        'Pending': 'قيد الانتظار',
        'Confirmed': 'مؤكد',
        'Cancelled': 'ملغى',
        'Completed': 'مكتمل',
        'Scheduled': 'مجدولة',
        'InProgress': 'جارية',
        'NoShow': 'لم يحضر',
        'Succeeded': 'ناجحة',
        'Failed': 'فاشلة',
        'Refunded': 'مستردة',

        // Account / Profile
        'Approved': 'تمت الموافقة',
        'Rejected': 'مرفوض',
        'Suspended': 'موقوف',
        'Active': 'نشط',
        'Inactive': 'غير نشط',

        // Payouts
        'Paid': 'تم الدفع',
        'History': 'السجل',

        // Actions
        'Save': 'حفظ',
        'Cancel': 'إلغاء',
        'Delete': 'حذف',
        'Edit': 'تعديل',
        'View': 'عرض',
        'Loading': 'جاري التحميل...',
        'Error': 'خطأ',
        'Success': 'تم بنجاح',
    };

    return map[status] || status;
};

export const getStatusColor = (status: string): string => {
    const map: Record<string, string> = {
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'Completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        'Succeeded': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        'Refunded': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        'Scheduled': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
        'InProgress': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        'NoShow': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}
