import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { maintenanceApi } from '../services/maintenanceApi';
import { MaintenanceRequest, RequestStatus } from '../types/maintenance';

export const RequestDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [request, setRequest] = useState<MaintenanceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<RequestStatus | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchRequest();
        }
    }, [id]);

    useEffect(() => {
        if (request) {
            setSelectedStatus(request.status);
        }
    }, [request]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            const data = await maintenanceApi.get(Number(id));
            setRequest(data);
        } catch (err: any) {
            showToast(err.response?.data?.detail || 'Failed to load request', 'error');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!request || !selectedStatus || selectedStatus === request.status) return;

        try {
            setUpdating(true);
            await maintenanceApi.update(request.id, { status: selectedStatus });
            setRequest({ ...request, status: selectedStatus });
            showToast('Status updated successfully', 'success');
        } catch (err: any) {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdating(false);
        }
    };

    if (loading || !request) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Loading request details...</p>
                </div>
            </div>
        );
    }

    const statusChanged = selectedStatus !== request.status;

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
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-6 text-sm">
                        <button onClick={() => navigate('/dashboard')} className="text-primary-600 hover:underline">
                            Dashboard
                        </button>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-600">Request #{request.id}</span>
                    </nav>

                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{request.subject}</h2>
                            <p className="text-gray-500 mt-1">Request #{request.id}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <select
                                value={selectedStatus || ''}
                                onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                                className="input-field"
                            >
                                <option value={RequestStatus.NEW}>New</option>
                                <option value={RequestStatus.IN_PROGRESS}>In Progress</option>
                                <option value={RequestStatus.REPAIRED}>Repaired</option>
                                <option value={RequestStatus.SCRAP}>Scrap</option>
                            </select>
                            {statusChanged && (
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={updating}
                                    className="btn-primary"
                                >
                                    {updating ? 'Updating...' : 'Update Status'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Request Details */}
                    <div className="card mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Equipment ID
                                </label>
                                <p className="text-gray-900">#{request.equipment_id}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <p className="text-gray-900 capitalize">{request.category}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>
                                <p className="text-gray-900 capitalize">{request.priority}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company
                                </label>
                                <p className="text-gray-900">{request.company}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Created At
                                </label>
                                <p className="text-gray-900">{new Date(request.created_at).toLocaleString()}</p>
                            </div>

                            {request.scheduled_date && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Date
                                    </label>
                                    <p className="text-gray-900">{new Date(request.scheduled_date).toLocaleString()}</p>
                                </div>
                            )}

                            {request.completion_date && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Completion Date
                                    </label>
                                    <p className="text-gray-900">{new Date(request.completion_date).toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                        {request.description && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Back Button */}
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
