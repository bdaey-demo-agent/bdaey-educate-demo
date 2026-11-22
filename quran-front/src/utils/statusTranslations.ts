
export const translateStatus = (status: string): string => {
    const map: Record<string, string> = {
        // General / Booking
        'Pending': 'Pending',
        'Confirmed': 'Confirmed',
        'Cancelled': 'Cancelled',
        'Completed': 'Completed',
        'Scheduled': 'Scheduled',
        'InProgress': 'In Progress',
        'NoShow': 'No Show',
        'Succeeded': 'Succeeded',
        'Failed': 'Failed',
        'Refunded': 'Refunded',

        // Account / Profile
        'Approved': 'Approved',
        'Rejected': 'Rejected',
        'Suspended': 'Suspended',
        'Active': 'Active',
        'Inactive': 'Inactive',

        // Payouts
        'Paid': 'Paid',
        'History': 'History',

        // Actions
        'Save': 'Save',
        'Cancel': 'Cancel',
        'Delete': 'Delete',
        'Edit': 'Edit',
        'View': 'View',
        'Loading': 'Loading...',
        'Error': 'Error',
        'Success': 'Success',
    };

    return map[status] || status;
};

export const getStatusColor = (status: string): string => {
    const map: Record<string, string> = {
        'Pending': 'Pending',
        'Confirmed': 'Confirmed',
        'Approved': 'Approved',
        'Completed': 'Completed',
        'Succeeded': 'Succeeded',
        'Cancelled': 'Cancelled',
        'Rejected': 'Rejected',
        'Failed': 'Failed',
        'Refunded': 'Refunded',
        'Scheduled': 'Scheduled',
        'InProgress': 'In Progress',
        'NoShow': 'No Show',
    };
    return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}
