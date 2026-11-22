import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    children?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    children
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="mt-2">
                <div className={`flex items-start gap-3 mb-4 ${isDanger ? 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900' : ''}`}>
                    {isDanger && <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />}
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                        {message}
                    </p>
                </div>
                {children && <div className="mt-4">{children}</div>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    className="inline-flex justify-center rounded-lg border border-transparent bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                    onClick={onClose}
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none ${isDanger
                        ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
                        : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                        }`}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
