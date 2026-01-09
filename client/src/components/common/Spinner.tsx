import React from 'react';
import { cn } from '../../lib/utility';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={cn(
                    'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
                    sizes[size],
                    className
                )}
            ></div>
        </div>
    );
}