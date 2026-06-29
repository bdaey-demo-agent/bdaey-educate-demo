import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div className={`card ${className}`} onClick={onClick}>
            {children}
        </div>
    );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', title, action }) => {
    if (title || action) {
        return (
            <div className={`card-header ${className}`}>
                {title && <h3 className="card-title">{title}</h3>}
                {action && <div>{action}</div>}
                {children}
            </div>
        );
    }
    return <div className={`card-header ${className}`}>{children}</div>;
};

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return <div className={`card-body ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    return <div className={`card-footer mt-4 pt-3 border-t border-gray-200 ${className}`}>{children}</div>;
};
