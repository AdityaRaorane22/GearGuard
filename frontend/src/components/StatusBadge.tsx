import React from 'react';
import { RequestStatus } from '../types/maintenance';

interface StatusBadgeProps {
    status: RequestStatus | string;
    size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
        [RequestStatus.NEW]: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            label: 'New',
            icon: '🆕'
        },
        [RequestStatus.IN_PROGRESS]: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            label: 'In Progress',
            icon: '⚙️'
        },
        [RequestStatus.REPAIRED]: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            label: 'Repaired',
            icon: '✅'
        },
        [RequestStatus.SCRAP]: {
            bg: 'bg-red-100',
            text: 'text-red-800',
            label: 'Scrap',
            icon: '🚮'
        },
    };

    const config = statusConfig[status] || statusConfig[RequestStatus.NEW];

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    return (
        <span className={`inline-flex items-center font-semibold rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
        </span>
    );
};
