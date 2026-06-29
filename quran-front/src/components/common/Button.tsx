import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseClass = `btn-${variant}`;
    const disabledClass = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <button
            className={`${baseClass} ${disabledClass} ${className} d-flex align-center justify-center gap-2`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <i className="fas fa-spinner fa-spin"></i>}
            {!isLoading && leftIcon && <span className="d-flex align-center">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="d-flex align-center">{rightIcon}</span>}
        </button>
    );
};
