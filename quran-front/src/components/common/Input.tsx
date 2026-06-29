import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, className = '', containerClassName = '', ...props }, ref) => {
        const hasIcon = !!leftIcon;
        const iconClass = hasIcon ? 'input-with-icon-left' : '';
        const errorClass = error ? 'input-error' : '';

        return (
            <div className={`mb-4 ${containerClassName}`}>
                {label && <label className="input-label" htmlFor={props.id}>{label}</label>}

                <div className={`input-with-icon ${iconClass}`}>
                    {leftIcon && (
                        <div className="input-icon">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`input-field ${errorClass} ${className}`}
                        {...props}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        );
    }
);

Input.displayName = 'Input';
