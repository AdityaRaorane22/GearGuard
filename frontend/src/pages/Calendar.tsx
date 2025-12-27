import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { maintenanceApi } from '../services/maintenanceApi';
import { equipmentApi } from '../services/equipmentApi';
import { Equipment } from '../types/equipment';
import { MaintenanceRequest, RequestPriority, RequestStatus } from '../types/maintenance';

export const Calendar: React.FC = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
    const [selectedPriority, setSelectedPriority] = useState<RequestPriority | 'all'>('all');

    // Calendar helpers
    const getMonthData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();
        const monthLength = lastDay.getDate();

        return { year, month, firstDay, lastDay, startingDayOfWeek, monthLength };
    };

    const getPriorityColor = (priority: RequestPriority): string => {
        switch (priority) {
            case RequestPriority.LOW:
                return 'bg-green-100 text-green-800 border-green-300';
            case RequestPriority.MEDIUM:
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case RequestPriority.HIGH:
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case RequestPriority.URGENT:
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getRequestsForDate = (date: Date): MaintenanceRequest[] => {
        return requests.filter(req => {
            if (!req.scheduled_date) return false;
            const reqDate = new Date(req.scheduled_date);
            return reqDate.getDate() === date.getDate() &&
                reqDate.getMonth() === date.getMonth() &&
                reqDate.getFullYear() === date.getFullYear();
        });
    };

    const handleDateClick = (date: Date) => {
        // Navigate to new request with pre-filled scheduled date
        const dateStr = date.toISOString().split('T')[0];
        navigate(`/request/new?scheduled_date=${dateStr}`);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params: any = { page_size: 100 };

            if (selectedEquipmentId) {
                params.equipment_id = selectedEquipmentId;
            }

            const response = await maintenanceApi.list(params);

            // Apply frontend filters
            let filtered = response.items;

            if (selectedStatus !== 'all') {
                filtered = filtered.filter(r => r.status === selectedStatus);
            }

            if (selectedPriority !== 'all') {
                filtered = filtered.filter(r => r.priority === selectedPriority);
            }

            setRequests(filtered);
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
    }, [selectedEquipmentId, selectedStatus, selectedPriority]);

    const renderCalendar = () => {
        const { year, month, startingDayOfWeek, monthLength } = getMonthData();
        const days: JSX.Element[] = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Day headers
        dayNames.forEach(name => {
            days.push(
                <div key={`header-${name}`} className="p-2 text-center font-semibold text-gray-700 bg-gray-100 border-b">
                    {name}
                </div>
            );
        });

        // Empty cells before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50 border"></div>);
        }

        // Calendar days
        for (let day = 1; day <= monthLength; day++) {
            const date = new Date(year, month, day);
            const dayRequests = getRequestsForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();

            days.push(
                <div
                    key={`day-${day}`}
                    className={`p-2 border min-h-[100px] cursor-pointer hover:bg-gray-50 transition relative ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                        }`}
                    onClick={() => handleDateClick(date)}
                >
                    <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                    </div>
                    <div className="mt-1 space-y-1">
                        {dayRequests.slice(0, 3).map((req) => (
                            <div
                                key={req.id}
                                className={`text-xs px-1 py-0.5 rounded border truncate ${getPriorityColor(req.priority)}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/request/${req.id}`);
                                }}
                            >
                                {req.subject}
                            </div>
                        ))}
                        {dayRequests.length > 3 && (
                            <div className="text-xs text-gray-500 px-1">
                                +{dayRequests.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

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
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Calendar</h2>
                    </div>

                    {/* Controls */}
                    <div className="card mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Month Navigation */}
                            <div className="flex items-center space-x-4">
                                <button onClick={handlePrevMonth} className="btn-secondary">
                                    ← Previous
                                </button>
                                <button onClick={handleToday} className="btn-secondary">
                                    Today
                                </button>
                                <button onClick={handleNextMonth} className="btn-secondary">
                                    Next →
                                </button>
                                <h3 className="text-xl font-semibold text-gray-900 ml-4">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h3>
                            </div>

                            {/* Filters */}
                            <div className="flex items-center space-x-3">
                                <select
                                    value={selectedEquipmentId || ''}
                                    onChange={(e) => setSelectedEquipmentId(e.target.value ? Number(e.target.value) : null)}
                                    className="input-field text-sm"
                                >
                                    <option value="">All Equipment</option>
                                    {equipment.map((eq) => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                                    className="input-field text-sm"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value={RequestStatus.NEW}>New</option>
                                    <option value={RequestStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={RequestStatus.REPAIRED}>Repaired</option>
                                    <option value={RequestStatus.SCRAP}>Scrap</option>
                                </select>

                                <select
                                    value={selectedPriority}
                                    onChange={(e) => setSelectedPriority(e.target.value as any)}
                                    className="input-field text-sm"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value={RequestPriority.LOW}>Low</option>
                                    <option value={RequestPriority.MEDIUM}>Medium</option>
                                    <option value={RequestPriority.HIGH}>High</option>
                                    <option value={RequestPriority.URGENT}>Critical</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="card mb-6">
                        <div className="flex items-center space-x-6 text-sm">
                            <span className="font-medium text-gray-700">Priority:</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                                <span>Low</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                                <span>Medium</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
                                <span>High</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                                <span>Critical</span>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="card">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                <p className="mt-2 text-gray-600">Loading calendar...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-0">
                                {renderCalendar()}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
