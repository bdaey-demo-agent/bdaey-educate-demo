import api from './api';

export type TransactionStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Refunded' | 'Cancelled';

export type Transaction = {
    id: number;
    amount: number;
    type: string;
    status: TransactionStatus;
    description: string;
    referenceId: string;
    createdAt: string;
    provider?: string;
    providerTransactionId?: string;
    balanceBefore: number;
    balanceAfter: number;
    currency: string;
    user: {
        id: string;
        fullName: string;
        email: string;
    };
};

export type PaginatedResult<T> = {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
};

export type TransactionFilter = {
    page: number;
    pageSize: number;
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    searchQuery?: string;
    provider?: string;
};

export type FinancialSummary = {
    totalDeposits: number;
    totalManualDeposits: number; // New Field  
    totalCouponDeposits: number; // New Field
    totalPayments: number;
    totalRefunds: number;
    platformProfit: number; // New Field
    netFlow: number;
};

export type WalletData = {
    balance: number;
    pendingBalance: number;
    currency: string;
    transactions: Transaction[];
};

const getWallet = async (): Promise<WalletData> => {
    const response = await api.get('/wallet');
    return response.data;
};



// Deposit DTO
export type AdminDepositDto = {
    userEmail: string;
    amount: number;
    description: string;
};

// Admin Methods
const getAdminTransactions = async (filter: TransactionFilter): Promise<PaginatedResult<Transaction>> => {
    const response = await api.get('/wallet/admin/transactions', { params: filter });
    return response.data;
};

const getAdminSummary = async (from?: string, to?: string): Promise<FinancialSummary> => {
    const response = await api.get('/wallet/admin/summary', { params: { from, to } });
    return response.data;
};

const adminDeposit = async (data: AdminDepositDto): Promise<void> => {
    await api.post('/wallet/admin/deposit', data);
};


// Bulk Deposit DTO
export type BulkDepositDto = {
    teacherProfileIds: number[];
    isAll: boolean;
    amount: number;
    description: string;
};

const adminBulkDeposit = async (data: BulkDepositDto): Promise<void> => {
    await api.post('/wallet/admin/bulk-deposit', data);
};

// Bulk Deposit Student DTO
export type BulkDepositStudentDto = {
    userIds: string[];
    isAll: boolean;
    amount: number;
    description: string;
};

const adminBulkDepositStudent = async (data: BulkDepositStudentDto): Promise<void> => {
    await api.post('/wallet/admin/bulk-deposit-student', data);
};

const getUserWallet = async (userId: string): Promise<WalletData> => {
    const response = await api.get(`/wallet/admin/wallet/${userId}`);
    return response.data;
};

const walletService = {
    getWallet,
    getAdminTransactions,
    getAdminSummary,
    adminDeposit,
    adminBulkDeposit,
    adminBulkDepositStudent,
    getUserWallet,
    deposit: async (amount: number, returnUrl?: string): Promise<{ paymentUrl: string }> => {
        const response = await api.post('/wallet/deposit', { amount, returnUrl });
        return response.data;
    },
    redeemPromoCode: async (code: string): Promise<{ message: string; amount: number }> => {
        const response = await api.post('/wallet/redeem-promo', { code });
        return response.data;
    }
};

export default walletService;
