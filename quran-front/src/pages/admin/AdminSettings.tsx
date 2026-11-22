import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { CogIcon, CurrencyDollarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AdminSettings: React.FC = () => {
    const [globalCommission, setGlobalCommission] = useState<number>(0);
    const [globalPenalty, setGlobalPenalty] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false); // Can track separate saving states if needed

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const [commission, penalty] = await Promise.all([
                adminService.getGlobalCommission(),
                adminService.getGlobalDeletionPenalty()
            ]);
            setGlobalCommission(commission);
            setGlobalPenalty(penalty);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCommission = async () => {
        try {
            setSaving(true);
            await adminService.updateGlobalCommission(globalCommission);
            toast.success('Platform commission updated');
        } catch (error) {
            toast.error('Failed to update commission');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePenalty = async () => {
        try {
            setSaving(true);
            await adminService.updateGlobalDeletionPenalty(globalPenalty);
            toast.success('Package deletion penalty updated');
        } catch (error) {
            toast.error('Failed to update penalty');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <CogIcon className="h-8 w-8 text-blue-600" />
                Platform Settings
            </h1>

            {/* Global Commission Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Default Platform Commission</h2>
                        <p className="text-gray-500 text-sm">The percentage deducted from each session for teachers without a custom rate.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative rounded-md shadow-sm w-40">
                        <input
                            type="number"
                            value={globalCommission}
                            onChange={(e) => setGlobalCommission(parseFloat(e.target.value))}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-blue-500 focus:ring-blue-500 py-2 pr-2 pl-8"
                            placeholder="0.00"
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveCommission}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Global Penalty Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        <CurrencyDollarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Package Deletion Penalty</h2>
                        <p className="text-gray-500 text-sm">The amount deducted from a teacher when they delete a package with active bookings.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative rounded-md shadow-sm w-40">
                        <input
                            type="number"
                            value={globalPenalty}
                            onChange={(e) => setGlobalPenalty(parseFloat(e.target.value))}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-red-500 focus:ring-red-500 py-2 pr-2 pl-3"
                            placeholder="0.00"
                        />
                    </div>
                    <button
                        onClick={handleSavePenalty}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    Note: this value can be overridden for a specific teacher from the Teacher Management page.
                </p>
            </div>
        </div>
    );
};

export default AdminSettings;
