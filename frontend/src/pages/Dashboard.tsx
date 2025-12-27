import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigation } from '../components/Navigation';
import { DashboardCard } from '../components/DashboardCard';
import { MaintenanceRequestSummary, RequestStatus, RequestCategory } from '../types/dashboard';

// Mock data for demonstration
const mockMetrics = {
    criticalEquipment: {
        count: 12,
        healthPercentage: 25,
    },
    technicianLoad: {
        utilizationPercentage: 85,
    },
    openRequests: {
        total: 34,
        overdue: 8,
    },
};

const mockRequests: MaintenanceRequestSummary[] = [
    {
        id: 1,
        subject: 'Hydraulic Press - Oil Leak',
        employee: 'John Smith',
        technician: 'Mike Johnson',
        category: RequestCategory.CORRECTIVE,
        status: RequestStatus.IN_PROGRESS,
        company: 'Adani Enterprises',
        scheduledDate: '2024-01-15',
        isOverdue: true,
    },
    {
        id: 2,
        subject: 'Conveyor Belt Alignment',
        employee: 'Sarah Williams',
        technician: 'David Brown',
        category: RequestCategory.PREVENTIVE,
        status: RequestStatus.NEW,
        company: 'Adani Enterprises',
        scheduledDate: '2024-01-20',
        isOverdue: false,
    },
    {
        id: 3,
        subject: 'Generator - Routine Maintenance',
        employee: 'Robert Davis',
        technician: 'Mike Johnson',
        category: RequestCategory.PREVENTIVE,
        status: RequestStatus.NEW,
        company: 'Adani Enterprises',
        scheduledDate: '2024-01-18',
        isOverdue: false,
    },
    {
        id: 4,
        subject: 'HVAC System - Temperature Control Issue',
        employee: 'Emily Wilson',
        technician: 'James Anderson',
        category: RequestCategory.CORRECTIVE,
        status: RequestStatus.REPAIRED,
        company: 'Adani Enterprises',
        scheduledDate: '2024-01-10',
        isOverdue: false,
    },
    {
        id: 5,
        subject: 'Forklift Battery Replacement',
        employee: 'Michael Brown',
        technician: 'David Brown',
        category: RequestCategory.CORRECTIVE,
        status: RequestStatus.IN_PROGRESS,
        company: 'Adani Enterprises',
        scheduledDate: '2024-01-12',
        isOverdue: true,
    },
];

const getStatusBadge = (status: RequestStatus) => {
    const statusConfig = {
        [RequestStatus.NEW]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'New' },
        [RequestStatus.IN_PROGRESS]: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
        [RequestStatus.REPAIRED]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Repaired' },
        [RequestStatus.SCRAP]: { bg: 'bg-red-100', text: 'text-red-800', label: 'Scrap' },
    };

    const config = statusConfig[status];
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    // Filter requests based on search query
    const filteredRequests = useMemo(() => {
        if (!searchQuery) return mockRequests;

        const query = searchQuery.toLowerCase();
        return mockRequests.filter(
            (request) =>
                request.subject.toLowerCase().includes(query) ||
                request.employee.toLowerCase().includes(query) ||
                request.technician.toLowerCase().includes(query) ||
                request.category.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">GearGuard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                            {user?.name} ({user?.role})
                        </span>
                        <button onClick={logout} className="btn-secondary text-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <Navigation />

            {/* Main Content */}
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header with Actions */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Overview</h2>
                        <button className="btn-primary">
                            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Request
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Critical Equipment Card */}
                        <DashboardCard
                            title="Critical Equipment"
                            value={mockMetrics.criticalEquipment.count}
                            subtitle={`Health: ${mockMetrics.criticalEquipment.healthPercentage}% - Needs Attention`}
                            color="red"
                            warning={mockMetrics.criticalEquipment.healthPercentage < 30}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                        />

                        {/* Technician Load Card */}
                        <DashboardCard
                            title="Technician Load"
                            value={`${mockMetrics.technicianLoad.utilizationPercentage}%`}
                            subtitle="Assign Carefully"
                            color="blue"
                            warning={mockMetrics.technicianLoad.utilizationPercentage > 80}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                        />

                        {/* Open Requests Card */}
                        <DashboardCard
                            title="Open Requests"
                            value={mockMetrics.openRequests.total}
                            subtitle={`${mockMetrics.openRequests.overdue} Overdue`}
                            color={mockMetrics.openRequests.overdue > 0 ? 'yellow' : 'green'}
                            warning={mockMetrics.openRequests.overdue > 0}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search requests by subject, employee, technician, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Maintenance Requests Table */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Maintenance Requests</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Technician
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Company
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No maintenance requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {request.isOverdue && (
                                                            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {request.subject}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {request.employee}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {request.technician}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                    {request.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(request.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {request.company}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
