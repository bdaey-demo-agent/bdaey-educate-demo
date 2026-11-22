import React, { useEffect, useState } from 'react';

interface DateInputProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange, label, className = "" }) => {
    const [day, setDay] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [year, setYear] = useState<string>('');

    // Initialize state from value prop
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setDay(date.getDate().toString());
                setMonth((date.getMonth() + 1).toString());
                setYear(date.getFullYear().toString());
            }
        }
    }, [value]);

    // Handle internal changes
    const handleChange = (d: string, m: string, y: string) => {
        setDay(d);
        setMonth(m);
        setYear(y);

        if (d && m && y) {
            // Format to YYYY-MM-DD
            // Pad month and day with leading zeros
            const paddedMonth = m.padStart(2, '0');
            const paddedDay = d.padStart(2, '0');
            onChange(`${y}-${paddedMonth}-${paddedDay}`);
        } else {
            onChange('');
        }
    };

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    return (
        <div className={`date-input-container ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <div className="grid grid-cols-3 gap-2 rtl:grid-cols-reverse">
                {/* Year */}
                <select
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                    value={year}
                    onChange={(e) => handleChange(day, month, e.target.value)}
                >
                    <option value="">Year</option>
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                {/* Month */}
                <select
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                    value={month}
                    onChange={(e) => handleChange(day, e.target.value, year)}
                >
                    <option value="">Month</option>
                    {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>

                {/* Day */}
                <select
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                    value={day}
                    onChange={(e) => handleChange(e.target.value, month, year)}
                >
                    <option value="">Day</option>
                    {days.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DateInput;
