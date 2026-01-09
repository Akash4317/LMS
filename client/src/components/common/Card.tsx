import React from 'react';
import { cn } from '../../lib/utility';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
    return (
        <div
            className={cn(
                'bg-white rounded-lg shadow-md p-6 transition-shadow hover:shadow-lg',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}>
            {children}
        </div>
    );
}