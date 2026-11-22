import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, BuildingLibraryIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { safeJsonParse } from '../../utils/helpers';
import api from '../../services/api';

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableBalance: number;
    onSuccess: () => void;
}

interface SavedMethod {
    id: number;
    methodType: string;
    detailsJson: string;
    isDefault: boolean;
    nickname?: string;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, availableBalance, onSuccess }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [methodType, setMethodType] = useState<'Wallet' | 'Bank'>('Wallet');
    const [details, setDetails] = useState({
        walletNumber: '',
        bankName: '',
        holderName: '',
        iban: '',
        accountNumber: ''
    });
    const [saveMethod, setSaveMethod] = useState(false);
    const [methodName, setMethodName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Saved Methods State
    const [savedMethods, setSavedMethods] = useState<SavedMethod[]>([]);
    const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchSavedMethods();
        }
    }, [isOpen]);

    const fetchSavedMethods = async () => {
        try {
            const response = await api.get('/withdrawals/methods');
            setSavedMethods(response.data);
        } catch (error) {
            console.error('Failed to fetch saved methods', error);
        }
    };

    const handleSelectSavedMethod = (methodId: number) => {
        if (methodId === -1) {
            // New Method
            setSelectedSavedMethodId(null);
            setDetails({ walletNumber: '', bankName: '', holderName: '', iban: '', accountNumber: '' });
            return;
        }

        const method = savedMethods.find(m => m.id === methodId);
        if (method) {
            setSelectedSavedMethodId(methodId);
            setMethodType(method.methodType as 'Wallet' | 'Bank');
            try {
                const parsed = safeJsonParse(method.detailsJson, {});
                if (method.methodType === 'Wallet') {
                    setDetails({
                        walletNumber: parsed.walletNumber || '',
                        bankName: '', holderName: '', iban: '', accountNumber: ''
                    });
                } else {
                    setDetails({
                        walletNumber: '',
                        bankName: parsed.bank || '',
                        holderName: parsed.holder || '',
                        iban: parsed.iban || '',
                        accountNumber: parsed.account || ''
                    });
                }
            } catch (e) {
                console.error("Failed to parse details", e);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = Number(amount);
        if (numAmount < 500) {
            toast.error('Minimum withdrawal is 500 EGP');
            return;
        }
        if (numAmount > availableBalance) {
            toast.error('Insufficient balance');
            return;
        }

        const paymentDetails = methodType === 'Wallet'
            ? JSON.stringify({ walletNumber: details.walletNumber, provider: 'Vodafone/Etisalat/Orange/We' })
            : JSON.stringify({ bank: details.bankName, holder: details.holderName, iban: details.iban, account: details.accountNumber });

        setIsLoading(true);
        try {
            await api.post('/withdrawals/request', {
                amount: numAmount,
                paymentMethod: methodType,
                paymentDetailsJson: paymentDetails,
                savedMethodId: selectedSavedMethodId,
                saveMethod: saveMethod && !selectedSavedMethodId, // Only save if it's new
                methodName: methodName
            });

            toast.success('Withdrawal request submitted');
            onSuccess();
            onClose();
            setAmount('');
            setDetails({ walletNumber: '', bankName: '', holderName: '', iban: '', accountNumber: '' });
            setSaveMethod(false);
            setMethodName('');
            setSelectedSavedMethodId(null);
        } catch (error: any) {
            const msg = error.response?.data || error.message || 'Something went wrong';
            toast.error(typeof msg === 'string' ? msg : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-right align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex justify-between items-center mb-4">
                        <span>Withdraw Funds</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (EGP)</label>
                            <input
                                type="number"
                                required
                                min={500}
                                max={availableBalance}
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="mt-1 input-field w-full"
                                placeholder={`Available: ${availableBalance}`}
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 500 EGP</p>
                        </div>

                        {/* Saved Methods Dropdown */}
                        {savedMethods.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose a saved method</label>
                                <select
                                    className="input-field w-full"
                                    onChange={(e) => handleSelectSavedMethod(Number(e.target.value))}
                                    value={selectedSavedMethodId || -1}
                                >
                                    <option value={-1}>New method...</option>
                                    {savedMethods.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.nickname || `${m.methodType} - ${m.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Method Selection (Only if New) */}
                        <div className={selectedSavedMethodId ? 'opacity-50 pointer-events-none' : ''}>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Withdrawal Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMethodType('Wallet')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${methodType === 'Wallet'
                                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        <BanknotesIcon className="h-5 w-5" />
                                        <span>E-Wallet</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMethodType('Bank')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${methodType === 'Bank'
                                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        <BuildingLibraryIcon className="h-5 w-5" />
                                        <span>Bank Transfer</span>
                                    </button>
                                </div>
                            </div>

                            {methodType === 'Wallet' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={details.walletNumber}
                                        onChange={(e) => setDetails({ ...details, walletNumber: e.target.value })}
                                        className="mt-1 input-field w-full"
                                        placeholder="01xxxxxxxxx"
                                        readOnly={!!selectedSavedMethodId}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={details.bankName}
                                            onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                                            className="mt-1 input-field w-full"
                                            readOnly={!!selectedSavedMethodId}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Holder Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={details.holderName}
                                            onChange={(e) => setDetails({ ...details, holderName: e.target.value })}
                                            className="mt-1 input-field w-full"
                                            readOnly={!!selectedSavedMethodId}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number / IBAN</label>
                                        <input
                                            type="text"
                                            required
                                            value={details.iban}
                                            onChange={(e) => setDetails({ ...details, iban: e.target.value })}
                                            className="mt-1 input-field w-full"
                                            readOnly={!!selectedSavedMethodId}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Option */}
                        {!selectedSavedMethodId && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="saveMethod"
                                        checked={saveMethod}
                                        onChange={(e) => setSaveMethod(e.target.checked)}
                                        className="rounded text-green-600 focus:ring-green-500"
                                    />
                                    <label htmlFor="saveMethod" className="text-sm font-medium text-gray-700 dark:text-gray-300">Save this method for later</label>
                                </div>
                                {saveMethod && (
                                    <input
                                        type="text"
                                        value={methodName}
                                        onChange={(e) => setMethodName(e.target.value)}
                                        placeholder="Short name (e.g. My personal wallet)"
                                        className="input-field w-full text-sm"
                                        required
                                    />
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex justify-center items-center"
                            >
                                {isLoading ? 'Sending...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default WithdrawalModal;
