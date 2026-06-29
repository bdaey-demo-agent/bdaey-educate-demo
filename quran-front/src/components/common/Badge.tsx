import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
    let variantClass = '';

    switch (variant) {
        case 'success':
            variantClass = 'bg-green-100 text-green-800 border-green-200'; // Fallback / Tailwind
            break;
        case 'warning':
            variantClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
        case 'error':
            variantClass = 'bg-red-100 text-red-800 border-red-200';
            break;
        case 'info':
            variantClass = 'bg-blue-100 text-blue-800 border-blue-200';
            break;
        default:
            variantClass = 'bg-gray-100 text-gray-800 border-gray-200';
    }

    // We can also use custom classes if we defined them in components.css
    // For now relying on the .badge generic class + tailwind utility colors as a bridge

    return (
        <span className={`badge ${variantClass} ${className} border`}>
            {children}
        </span>
    );
};
