import { useRef, useState } from 'react';

interface FileUploadProps {
    accept?: string;
    onFileSelected: (file: File) => void;
    disabled?: boolean;
    buttonText?: string;
    variant?: 'plain' | 'gold';
}

// Custom file picker: native <input type="file"> renders its button text
// ("Choose File" / "No file chosen") in the browser's locale, so we hide it
// and render our own English button + file name instead.
export default function FileUpload({ accept, onFileSelected, disabled = false, buttonText = 'Choose File', variant = 'plain' }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');

    const buttonClasses = variant === 'gold'
        ? 'py-2 px-4 rounded-md text-sm font-semibold bg-gold-50 text-gold-700 hover:bg-gold-100 dark:bg-gold-900/30 dark:text-gold-400'
        : 'py-1 px-2 rounded-md bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500';

    return (
        <div className="flex items-center gap-2">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                disabled={disabled}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        setFileName(file.name);
                        onFileSelected(file);
                    }
                    e.target.value = '';
                }}
            />
            <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className={`${buttonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {buttonText}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {fileName || 'No file chosen'}
            </span>
        </div>
    );
}
