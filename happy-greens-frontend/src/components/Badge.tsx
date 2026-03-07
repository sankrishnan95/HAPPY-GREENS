import { ReactNode } from 'react';

interface BadgeProps {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
    className?: string;
}

const Badge = ({ variant = 'primary', size = 'md', children, className = '' }: BadgeProps) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full';

    const variants = {
        success: 'bg-green-100 text-green-700 border border-green-200',
        warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        error: 'bg-red-100 text-red-700 border border-red-200',
        info: 'bg-blue-100 text-blue-700 border border-blue-200',
        primary: 'bg-primary-100 text-primary-700 border border-primary-200',
        accent: 'bg-gradient-accent text-white shadow-sm',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    return (
        <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
