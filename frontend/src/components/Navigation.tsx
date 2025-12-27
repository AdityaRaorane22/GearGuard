import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavTab {
    name: string;
    path: string;
}

const navigationTabs: NavTab[] = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Kanban', path: '/kanban' },
    { name: 'Equipment', path: '/equipment' },
    { name: 'Reporting', path: '/reporting' },
    { name: 'Teams', path: '/teams' },
];

export const Navigation: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="px-6">
                <div className="flex space-x-8">
                    {navigationTabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className={`
                                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${isActive
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};
