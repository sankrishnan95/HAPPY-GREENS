import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
    isLoading?: boolean;
}

const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    isLoading = false,
    disabled,
    ...props
}: ButtonProps) => {
    const baseStyles = 'min-h-[44px] w-full sm:w-auto rounded-[1rem] font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_14px_30px_rgba(15,23,42,0.14)]',
        secondary: 'bg-green-600 text-white hover:bg-green-700 shadow-[0_14px_28px_rgba(34,197,94,0.2)]',
        outline: 'border border-[#cedfc1] bg-white text-slate-800 hover:bg-[#f5f8f0]',
        ghost: 'text-green-700 hover:bg-green-50',
        accent: 'bg-gradient-to-r from-lime-400 to-yellow-300 text-slate-900 hover:brightness-95 shadow-[0_14px_28px_rgba(163,230,53,0.22)]',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-5 py-3 text-sm',
        lg: 'px-5 py-3.5 text-sm sm:px-7 sm:text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </>
            ) : children}
        </button>
    );
};

export default Button;
