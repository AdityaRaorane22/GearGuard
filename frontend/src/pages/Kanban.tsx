import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { maintenanceApi } from '../services/maintenanceApi';
import { equipmentApi } from '../services/equipmentApi';
import { Equipment } from '../types/equipment';
import { MaintenanceRequest, RequestStatus, RequestPriority, RequestCategory } from '../types/maintenance';

export const Kanban: React.FC = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedCard, setDraggedCard] = useState<MaintenanceRequest | null>(null);

    // Filters
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<RequestPriority | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<RequestCategory | 'all'>('all');

    const columns: { status: RequestStatus; title: string; color: string }[] = [
        { status: RequestStatus.NEW, title: 'New', color: 'bg-yellow-100 border-yellow-300' },
        { status: RequestStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-100 border-blue-300' },
        { status: RequestStatus.REPAIRED, title: 'Repaired', color: 'bg-green-100 border-green-300' },
        { status: RequestStatus.SCRAP, title: 'Scrap', color: 'bg-red-100 border-red-300' },
    ];

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

    const isOverdue = (request: MaintenanceRequest): boolean => {
        if (!request.scheduled_date || request.status === RequestStatus.REPAIRED) return false;
        return new Date(request.scheduled_date) < new Date();
    };

    const getFilteredRequests = (status: RequestStatus): MaintenanceRequest[] => {
        return requests.filter(r => {
            if (r.status !== status) return false;
            if (selectedPriority !== 'all' && r.priority !== selectedPriority) return false;
            if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
            return true;
        });
    };

    const handleDragStart = (e: React.DragEvent, request: MaintenanceRequest) => {
        setDraggedCard(request);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: RequestStatus) => {
        e.preventDefault();

        if (!draggedCard || draggedCard.status === newStatus) {
            setDraggedCard(null);
            return;
        }

        try {
            // Update status via API
            await maintenanceApi.update(draggedCard.id, { status: newStatus });

            // Update local state
            setRequests(requests.map(r =>
                r.id === draggedCard.id ? { ...r, status: newStatus } : r
            ));

            showToast(`Request moved to ${newStatus.replace('_', ' ')}`, 'success');
        } catch (err: any) {
            showToast('Failed to update request status', 'error');
        } finally {
            setDraggedCard(null);
        }
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
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Kanban</h2>
                    </div>

                    {/* Filters */}
                    <div className="card mb-6">
                        <div className="flex items-center space-x-4">
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

                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value as any)}
                                className="input-field"
                            >
                                <option value="all">All Priorities</option>
                                <option value={RequestPriority.LOW}>Low</option>
                                <option value={RequestPriority.MEDIUM}>Medium</option>
                                <option value={RequestPriority.HIGH}>High</option>
                                <option value={RequestPriority.URGENT}>Urgent</option>
                            </select>

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
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <p className="mt-2 text-gray-600">Loading kanban board...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {columns.map((column) => {
                                const columnRequests = getFilteredRequests(column.status);

                                return (
                                    <div
                                        key={column.status}
                                        className="flex flex-col"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, column.status)}
                                    >
                                        {/* Column Header */}
                                        <div className={`card ${column.color} mb-4`}>
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                                <span className="px-2 py-1 bg-white rounded-full text-sm font-medium">
                                                    {columnRequests.length}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cards */}
                                        <div className="space-y-3 flex-1">
                                            {columnRequests.map((request) => (
                                                <div
                                                    key={request.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, request)}
                                                    onClick={() => navigate(`/request/${request.id}`)}
                                                    className={`card cursor-pointer hover:shadow-lg transition-shadow ${isOverdue(request) ? 'border-l-4 border-red-500' : ''
                                                        }`}
                                                >
                                                    {/* Priority Badge */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(request.priority)}`}>
                                                            {request.priority}
                                                        </span>
                                                        {isOverdue(request) && (
                                                            <span className="text-xs text-red-600 font-medium">Overdue</span>
                                                        )}
                                                    </div>

                                                    {/* Subject */}
                                                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                                                        {request.subject}
                                                    </h4>

                                                    {/* Equipment */}
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {request.equipment_id ? (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                {equipment.find(e => e.id === request.equipment_id)?.name || 'Equipment'}
                                                            </div>
                                                        ) : (
                                                            <div>Work Center: {request.work_center_name}</div>
                                                        )}
                                                    </div>

                                                    {/* Category & Date */}
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span className="capitalize">{request.category}</span>
                                                        {request.scheduled_date && (
                                                            <span>{new Date(request.scheduled_date).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {columnRequests.length === 0 && (
                                                <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                                    No requests
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
