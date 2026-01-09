import React from 'react';
import { cn, getInitials } from '../../lib/utility';

interface AvatarProps {
    src?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
    };

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center bg-primary-100 text-primary-700 font-semibold',
                sizes[size],
                className
            )}
        >
            {src ? (
                <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
                getInitials(name || '')
            )}
        </div>
    );
}