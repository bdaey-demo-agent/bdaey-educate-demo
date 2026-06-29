import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    isEditing: boolean;
    label?: string;
    multiline?: boolean;
    className?: string;
    placeholder?: string;
}

const EditableText: React.FC<EditableTextProps> = ({
    value,
    onSave,
    isEditing,
    label,
    multiline = false,
    className = "",
    placeholder = "Click to edit..."
}) => {
    const [isEditingField, setIsEditingField] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditingField && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingField]);

    const handleSave = async () => {
        if (tempValue === value) {
            setIsEditingField(false);
            return;
        }

        try {
            setSaving(true);
            await onSave(tempValue);
            setIsEditingField(false);
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditingField(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isEditing) {
        return <div className={className}>{value || <span className="text-gray-400 italic">Not set</span>}</div>;
    }

    if (isEditingField) {
        return (
            <div className={`relative ${className}`}>
                {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
                {multiline ? (
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-2 border-2 border-primary-300 rounded-lg focus:border-primary-500 focus:ring-0 bg-white dark:bg-gray-800 dark:text-white"
                        rows={4}
                    />
                ) : (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-2 border-2 border-primary-300 rounded-lg focus:border-primary-500 focus:ring-0 bg-white dark:bg-gray-800 dark:text-white"
                    />
                )}
                <div className="flex justify-end gap-1 mt-1">
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1 text-green-500 hover:bg-green-50 rounded-full"
                    >
                        <CheckIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditingField(true)}
            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 -m-1 rounded transition-colors group relative ${className}`}
            title="Click to edit"
        >
            {value || <span className="text-gray-400 italic">{placeholder}</span>}
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-gray-200 dark:bg-gray-700 text-xs px-1 rounded">Edit</span>
            </div>
        </div>
    );
};

export default EditableText;
