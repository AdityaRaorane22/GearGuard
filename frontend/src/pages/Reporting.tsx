import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { maintenanceApi } from '../services/maintenanceApi';
import { equipmentApi } from '../services/equipmentApi';
import { Equipment } from '../types/equipment';
import { MaintenanceRequest, RequestStatus, RequestPriority, RequestCategory } from '../types/maintenance';

export const Reporting: React.FC = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();

    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<RequestCategory | 'all'>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    // Computed metrics
    const getFilteredRequests = (): MaintenanceRequest[] => {
        let filtered = [...requests];

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(r => r.status === selectedStatus);
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(r => r.category === selectedCategory);
        }

        if (dateFrom) {
            filtered = filtered.filter(r => new Date(r.created_at) >= new Date(dateFrom));
        }

        if (dateTo) {
            filtered = filtered.filter(r => new Date(r.created_at) <= new Date(dateTo));
        }

        return filtered;
    };

    const getStatusCounts = () => {
        const filtered = getFilteredRequests();
        return {
            new: filtered.filter(r => r.status === RequestStatus.NEW).length,
            in_progress: filtered.filter(r => r.status === RequestStatus.IN_PROGRESS).length,
            repaired: filtered.filter(r => r.status === RequestStatus.REPAIRED).length,
            scrap: filtered.filter(r => r.status === RequestStatus.SCRAP).length,
        };
    };

    const getPriorityCounts = () => {
        const filtered = getFilteredRequests();
        return {
            low: filtered.filter(r => r.priority === RequestPriority.LOW).length,
            medium: filtered.filter(r => r.priority === RequestPriority.MEDIUM).length,
            high: filtered.filter(r => r.priority === RequestPriority.HIGH).length,
            urgent: filtered.filter(r => r.priority === RequestPriority.URGENT).length,
        };
    };

    const getCategoryCounts = () => {
        const filtered = getFilteredRequests();
        return {
            corrective: filtered.filter(r => r.category === RequestCategory.CORRECTIVE).length,
            preventive: filtered.filter(r => r.category === RequestCategory.PREVENTIVE).length,
        };
    };

    const getAverageResolutionTime = (): string => {
        const filtered = getFilteredRequests();
        const completed = filtered.filter(r => r.completion_date && r.created_at);

        if (completed.length === 0) return 'N/A';

        const totalDays = completed.reduce((sum, r) => {
            const start = new Date(r.created_at).getTime();
            const end = new Date(r.completion_date!).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0);

        return `${(totalDays / completed.length).toFixed(1)} days`;
    };

    const getTopEquipment = (): { name: string; count: number }[] => {
        const filtered = getFilteredRequests();
        const equipmentCounts: { [key: number]: number } = {};

        filtered.forEach(r => {
            if (r.equipment_id) {
                equipmentCounts[r.equipment_id] = (equipmentCounts[r.equipment_id] || 0) + 1;
            }
        });

        return Object.entries(equipmentCounts)
            .map(([id, count]) => {
                const eq = equipment.find(e => e.id === Number(id));
                return { name: eq?.name || `Equipment #${id}`, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const exportToCSV = () => {
        const filtered = getFilteredRequests();
        const headers = ['ID', 'Subject', 'Category', 'Priority', 'Status', 'Created', 'Completed', 'Duration (days)'];

        const rows = filtered.map(r => {
            const created = new Date(r.created_at);
            const completed = r.completion_date ? new Date(r.completion_date) : null;
            const duration = completed ? ((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1) : 'N/A';

            return [
                r.id,
                r.subject,
                r.category,
                r.priority,
                r.status,
                created.toLocaleDateString(),
                completed ? completed.toLocaleDateString() : 'N/A',
                duration
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Report exported successfully', 'success');
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params: any = { page_size: 100 };

            if (selectedEquipmentId) {
                params.equipment_id = selectedEquipmentId;
            }

            const response = await maintenanceApi.list(params);
            setRequests(response.items);
        } catch (err: any) {
            showToast('Failed to load maintenance requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await equipmentApi.list({ page_size: 100 });
            setEquipment(response.items);
        } catch (err: any) {
            console.error('Failed to load equipment', err);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [selectedEquipmentId]);

    const statusCounts = getStatusCounts();
    const priorityCounts = getPriorityCounts();
    const categoryCounts = getCategoryCounts();
    const filteredRequests = getFilteredRequests();
    const topEquipment = getTopEquipment();

    const renderBarChart = (data: { [key: string]: number }, colors: { [key: string]: string }) => {
        const max = Math.max(...Object.values(data), 1);

        return (
            <div className="space-y-3">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3">
                        <div className="w-24 text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                            <div
                                className={`h-full ${colors[key]} flex items-center justify-end px-2 text-white text-xs font-medium transition-all duration-300`}
                                style={{ width: `${(value / max) * 100}%` }}
                            >
                                {value > 0 && value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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

            {/* Navigation */}
            <Navigation />

            {/* Main Content */}
            <main className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Reports</h2>
                        <button onClick={exportToCSV} className="btn-primary">
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                                <select
                                    value={selectedEquipmentId || ''}
                                    onChange={(e) => setSelectedEquipmentId(e.target.value ? Number(e.target.value) : null)}
                                    className="input-field"
                                >
                                    <option value="">All Equipment</option>
                                    {equipment.map((eq) => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                                    className="input-field"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value={RequestStatus.NEW}>New</option>
                                    <option value={RequestStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={RequestStatus.REPAIRED}>Repaired</option>
                                    <option value={RequestStatus.SCRAP}>Scrap</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                                    className="input-field"
                                >
                                    <option value="all">All Categories</option>
                                    <option value={RequestCategory.CORRECTIVE}>Corrective</option>
                                    <option value={RequestCategory.PREVENTIVE}>Preventive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <p className="mt-2 text-gray-600">Loading reports...</p>
                        </div>
                    ) : (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div className="card">
                                    <div className="text-sm font-medium text-gray-600 mb-1">Total Requests</div>
                                    <div className="text-3xl font-bold text-gray-900">{filteredRequests.length}</div>
                                </div>

                                <div className="card">
                                    <div className="text-sm font-medium text-gray-600 mb-1">Active</div>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {statusCounts.new + statusCounts.in_progress}
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="text-sm font-medium text-gray-600 mb-1">Completed</div>
                                    <div className="text-3xl font-bold text-green-600">{statusCounts.repaired}</div>
                                </div>

                                <div className="card">
                                    <div className="text-sm font-medium text-gray-600 mb-1">Avg Resolution</div>
                                    <div className="text-2xl font-bold text-gray-900">{getAverageResolutionTime()}</div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Status Distribution */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                                    {renderBarChart(statusCounts, {
                                        new: 'bg-yellow-500',
                                        in_progress: 'bg-blue-500',
                                        repaired: 'bg-green-500',
                                        scrap: 'bg-red-500'
                                    })}
                                </div>

                                {/* Priority Distribution */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
                                    {renderBarChart(priorityCounts, {
                                        low: 'bg-green-500',
                                        medium: 'bg-blue-500',
                                        high: 'bg-orange-500',
                                        urgent: 'bg-red-500'
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Category Breakdown */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                                    {renderBarChart(categoryCounts, {
                                        corrective: 'bg-red-500',
                                        preventive: 'bg-green-500'
                                    })}
                                </div>

                                {/* Top Equipment */}
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Equipment (Most Requests)</h3>
                                    <div className="space-y-3">
                                        {topEquipment.length > 0 ? (
                                            topEquipment.map((item, idx) => (
                                                <div key={item.name} className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="font-medium text-gray-900">{item.name}</div>
                                                    </div>
                                                    <div className="text-gray-600 font-medium">{item.count} requests</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500 py-4">No data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};
