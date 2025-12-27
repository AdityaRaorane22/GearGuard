import React from 'react';

interface DashboardCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    color: 'red' | 'blue' | 'green' | 'yellow';
    icon: React.ReactNode;
    warning?: boolean;
}

const colorClasses = {
    red: {
        bg: 'bg-red-50',
        icon: 'bg-red-500',
        text: 'text-red-900',
        subtext: 'text-red-600',
    },
    blue: {
        bg: 'bg-blue-50',
        icon: 'bg-blue-500',
        text: 'text-blue-900',
        subtext: 'text-blue-600',
    },
    green: {
        bg: 'bg-green-50',
        icon: 'bg-green-500',
        text: 'text-green-900',
        subtext: 'text-green-600',
    },
    yellow: {
        bg: 'bg-yellow-50',
        icon: 'bg-yellow-500',
        text: 'text-yellow-900',
        subtext: 'text-yellow-600',
    },
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    value,
    subtitle,
    color,
    icon,
    warning = false,
}) => {
    const colors = colorClasses[color];

    return (
        <div className={`${colors.bg} rounded-lg p-6 transition-shadow hover:shadow-md`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
                    {subtitle && (
                        <p className={`text-sm mt-2 ${warning ? 'font-semibold' : ''} ${colors.subtext}`}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className={`${colors.icon} p-3 rounded-full text-white`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};
