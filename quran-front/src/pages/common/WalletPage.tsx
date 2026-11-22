import React, { useState, useEffect } from 'react';
import { BanknotesIcon, ArrowDownIcon, ArrowUpIcon, CreditCardIcon, ExclamationTriangleIcon, TicketIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import walletService, { type WalletData, type Transaction } from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';
import WithdrawalModal from '../../components/teacher/WithdrawalModal';
import toast from 'react-hot-toast';

const WalletPage: React.FC = () => {
    const { user } = useAuth();
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchWallet = async () => {
            setLoading(true);
            try {
                const data = await walletService.getWallet();
                setWallet(data);
            } catch (err) {
                console.error("Failed to fetch wallet", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'Deposit': return <ArrowUpIcon className="h-6 w-6 text-green-500" />;
            case 'Withdrawal': return <ArrowDownIcon className="h-6 w-6 text-red-500" />;
            case 'Payment': return <CreditCardIcon className="h-6 w-6 text-orange-500" />;
            case 'Income': return <BanknotesIcon className="h-6 w-6 text-primary-500" />;
            case 'Refund': return <ArrowDownIcon className="h-6 w-6 text-blue-500" />;
            default: return <BanknotesIcon className="h-6 w-6 text-gray-500" />;
        }
    };

    const isFailedStatus = (status: string) => {
        return status === 'Failed' || status === 'Cancelled';
    };

    const getTransactionText = (type: string) => {
        switch (type) {
            case 'Deposit': return 'Deposit';
            case 'Withdrawal': return 'Withdrawal';
            case 'Payment': return 'Session Payment';
            case 'Income': return 'Session Income';
            case 'Refund': return 'Refund';
            default: return type;
        }
    };

    const getStatusBadge = (status: string, type: string) => {
        if (status === 'Pending' && type === 'Income') {
            return (
                <span className="text-xs font-medium text-orange-500 mt-1 bg-orange-50 dark:bg-orange-900/20 inline-block px-2 py-0.5 rounded">
                    Pending (available 24h after the session)
                </span>
            );
        }
        if (status === 'Pending') {
            return (
                <span className="text-xs font-medium text-yellow-600 mt-1 bg-yellow-50 dark:bg-yellow-900/20 inline-block px-2 py-0.5 rounded">
                    Processing
                </span>
            );
        }
        if (status === 'Failed' || status === 'Cancelled') {
            return (
                <span className="text-xs font-medium text-red-600 mt-1 bg-red-50 dark:bg-red-900/20 inline-block px-2 py-0.5 rounded">
                    {status === 'Cancelled' ? 'Cancelled' : 'Failed'}
                </span>
            );
        }
        if (status === 'Succeeded') {
            return (
                <span className="text-xs font-medium text-green-600 mt-1 bg-green-50 dark:bg-green-900/20 inline-block px-2 py-0.5 rounded">
                    Successful
                </span>
            );
        }
        return null;
    };

    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState<number>(100);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleDeposit = async () => {
        if (depositAmount < 10) {
            toast.error("Minimum top-up is 10 EGP");
            return;
        }
        try {
            const returnUrl = window.location.href; // Current page URL
            const { paymentUrl } = await walletService.deposit(depositAmount, returnUrl);
            window.location.href = paymentUrl; // Redirect to Kashier
        } catch (e) {
            console.error("Deposit error", e);
            toast.error("Error connecting to the payment gateway");
        }
    };

    const handleRedeemPromoCode = async () => {
        if (!promoCodeInput.trim()) return;
        setIsRedeeming(true);
        try {
            const data = await walletService.redeemPromoCode(promoCodeInput.trim());
            toast.success(`Wallet topped up with ${data.amount} EGP`);
            setShowPromoModal(false);
            setPromoCodeInput('');
            // Refetch wallet
            const newWalletData = await walletService.getWallet();
            setWallet(newWalletData);
        } catch (e: any) {
            console.error("Redeem error", e);
            toast.error(e.response?.data?.message || "Invalid or expired code");
        } finally {
            setIsRedeeming(false);
        }
    };

    // Check for status query param
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (status === 'success') {
            // Ideally show toast
            window.history.replaceState({}, '', window.location.pathname);
        } else if (status === 'failed') {
            // Show error toast
            setError(true); // Or distinct error state
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 animate-pulse">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-2xl mb-8"></div>
                    <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (error) return <div className="text-center py-10 text-red-500">Failed to load wallet data or a payment error occurred.</div>;
    if (!wallet) return <div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">E-Wallet</h1>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 text-white mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BanknotesIcon className="h-48 w-48" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-100 mb-2">Current Balance</p>
                        <h2 className="text-5xl font-bold mb-6">
                            {wallet.balance.toLocaleString()} <span className="text-2xl">{wallet.currency}</span>
                        </h2>

                        {wallet.pendingBalance > 0 && (
                            <div className="bg-blue-900/40 border border-blue-400/30 rounded-lg p-3 inline-flex items-center gap-2 mb-6">
                                <span className="text-blue-200 text-sm">Pending balance (earnings):</span>
                                <span className="font-bold text-lg text-white">{wallet.pendingBalance.toLocaleString()} {wallet.currency}</span>
                            </div>
                        )}

                        <div className="flex gap-4">
                            {user?.role === 'Teacher' && (
                                <button
                                    onClick={() => setShowWithdrawalModal(true)}
                                    className="bg-white text-blue-700 hover:bg-blue-50 py-2 px-6 rounded-lg font-bold transition-colors shadow-sm"
                                >
                                    Withdraw
                                </button>
                            )}

                            {user?.role === 'Student' && (
                                <button
                                    onClick={() => {
                                        if (!user?.emailConfirmed) {
                                            setShowVerificationModal(true);
                                            return;
                                        }
                                        setShowDepositModal(true);
                                    }}
                                    className={`py-2 px-6 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2 ${!user?.emailConfirmed
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}
                                    title={!user?.emailConfirmed ? "Please verify your email" : "Top up with a bank card"}
                                >
                                    <ArrowDownIcon className="h-5 w-5" />
                                    Top Up
                                </button>
                            )}

                            {user?.role === 'Student' && (
                                <button
                                    onClick={() => {
                                        if (!user?.emailConfirmed) {
                                            setShowVerificationModal(true);
                                            return;
                                        }
                                        setShowPromoModal(true);
                                    }}
                                    className={`py-2 px-6 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2 ${!user?.emailConfirmed
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-white text-blue-700 hover:bg-white/90'
                                        }`}
                                >
                                    <TicketIcon className="h-5 w-5" />
                                    Redeem Coupon
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Verification Required Modal */}
                {showVerificationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
                                <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Verification Required</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
                                Please verify your email first to use the wallet and top up. You can request an activation link from your profile page.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowVerificationModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <Link
                                    to="/student/profile"
                                    onClick={() => setShowVerificationModal(false)}
                                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Go to Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deposit Modal */}
                {showDepositModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Up Wallet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Enter the amount to add (in EGP)</p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                                <input
                                    type="number"
                                    min="10"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDepositModal(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeposit}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30"
                                >
                                    Top Up Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Promo Code Modal */}
                {showPromoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Redeem a Coupon</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Enter your coupon code to top up. Note: coupon top-ups are capped at 100 EGP per month.</p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coupon Code</label>
                                <input
                                    type="text"
                                    value={promoCodeInput}
                                    placeholder="Enter the code here (e.g. FREE50)"
                                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dir-ltr text-center font-bold tracking-widest uppercase"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPromoModal(false)}
                                    disabled={isRedeeming}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRedeemPromoCode}
                                    disabled={isRedeeming || !promoCodeInput.trim()}
                                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-lg shadow-primary-500/30 flex items-center gap-2"
                                >
                                    {isRedeeming && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                                    Redeem
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {user?.role === 'Teacher' && wallet && (
                    <WithdrawalModal
                        isOpen={showWithdrawalModal}
                        onClose={() => setShowWithdrawalModal(false)}
                        availableBalance={wallet.balance}
                        onSuccess={() => {
                            // Reload page or refetch wallet
                            window.location.reload();
                        }}
                    />
                )}

                {/* Transactions History */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h3>
                    </div>

                    {wallet.transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            No transactions yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {wallet.transactions.map((t: Transaction) => (
                                <div key={t.id} className={`p-6 flex items-center justify-between transition-colors ${isFailedStatus(t.status) ? 'opacity-50 grayscale hover:bg-red-50/50 dark:hover:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${isFailedStatus(t.status) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                            {getTransactionIcon(t.type)}
                                        </div>
                                        <div>
                                            <p className={`font-bold ${isFailedStatus(t.status) ? 'text-red-700 dark:text-red-400 line-through' : 'text-gray-900 dark:text-white'}`}>{getTransactionText(t.type)}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(t.createdAt).toLocaleDateString('en-GB')} - {new Date(t.createdAt).toLocaleTimeString('en-GB')}
                                            </p>
                                            {getStatusBadge(t.status, t.type)}
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold ${isFailedStatus(t.status) ? 'text-gray-400 line-through' : (t.amount > 0 ? 'text-green-600' : 'text-gray-900 dark:text-white')}`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} {wallet.currency}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
