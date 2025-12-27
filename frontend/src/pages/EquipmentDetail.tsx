import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { StatusBadge } from '../components/StatusBadge';
import { equipmentApi } from '../services/equipmentApi';
import { maintenanceApi } from '../services/maintenanceApi';
import { Equipment, EquipmentCategory, EquipmentUpdate } from '../types/equipment';
import { MaintenanceRequest } from '../types/maintenance';

export const EquipmentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<EquipmentUpdate>({});

    const canEdit = user?.role === 'Manager' || user?.role === 'Admin';
    const canDelete = user?.role === 'Admin';

    useEffect(() => {
        if (id) {
            fetchEquipment();
            fetchMaintenanceHistory();
        }
    }, [id]);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const data = await equipmentApi.get(Number(id));
            setEquipment(data);
            setFormData(data);
        } catch (err: any) {
            showToast(err.response?.data?.detail || 'Failed to load equipment', 'error');
            navigate('/equipment');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaintenanceHistory = async () => {
        try {
            const response = await maintenanceApi.list({ equipment_id: Number(id), page_size: 50 });
            setMaintenanceHistory(response.items);
        } catch (err: any) {
            console.error('Failed to load maintenance history', err);
        }
    };

    const handleSave = async () => {
        try {
            const updated = await equipmentApi.update(Number(id), formData);
            setEquipment(updated);
            setIsEditing(false);
            showToast('Equipment updated successfully', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.detail || 'Failed to update equipment', 'error');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) return;

        try {
            await equipmentApi.delete(Number(id));
            showToast('Equipment deleted successfully', 'success');
            navigate('/equipment');
        } catch (err: any) {
            showToast(err.response?.data?.detail || 'Failed to delete equipment', 'error');
        }
    };

    if (loading || !equipment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Loading equipment details...</p>
                </div>
            </div>
        );
    }

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
                        <button onClick={() => navigate('/equipment')} className="text-primary-600 hover:underline">
                            Equipment
                        </button>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-600">{equipment.name}</span>
                    </nav>

                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-3xl font-bold text-gray-900">{equipment.name}</h2>
                            {equipment.is_critical && (
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                                    Critical
                                </span>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            {canEdit && !isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn-secondary">
                                    Edit
                                </button>
                            )}
                            {canDelete && !isEditing && (
                                <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50">
                                    Delete
                                </button>
                            )}
                            {isEditing && (
                                <>
                                    <button onClick={() => { setIsEditing(false); setFormData(equipment); }} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} className="btn-primary">
                                        Save Changes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Equipment Details */}
                    <div className="card space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Equipment Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900">{equipment.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Serial Number
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.serial_number || ''}
                                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-mono">{equipment.serial_number}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.category || ''}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                                        className="input-field"
                                    >
                                        <option value={EquipmentCategory.MACHINERY}>Machinery</option>
                                        <option value={EquipmentCategory.VEHICLE}>Vehicle</option>
                                        <option value={EquipmentCategory.TOOL}>Tool</option>
                                        <option value={EquipmentCategory.ELECTRONIC}>Electronic</option>
                                        <option value={EquipmentCategory.OTHER}>Other</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900 capitalize">{equipment.category}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.department || ''}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900">{equipment.department}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.company || ''}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900">{equipment.company}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maintenance Team
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.maintenance_team || ''}
                                        onChange={(e) => setFormData({ ...formData, maintenance_team: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900">{equipment.maintenance_team || '-'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Work Center
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.work_center || ''}
                                        onChange={(e) => setFormData({ ...formData, work_center: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900">{equipment.work_center || '-'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.location || ''}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-gray-900">{equipment.location || '-'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Health Score
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.health_score || 0}
                                        onChange={(e) => setFormData({ ...formData, health_score: Number(e.target.value) })}
                                        className="input-field"
                                    />
                                ) : (
                                    <div className="flex items-center">
                                        <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                                            <div
                                                className={`h-3 rounded-full ${equipment.health_score >= 70 ? 'bg-green-500' :
                                                    equipment.health_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${equipment.health_score}%` }}
                                            />
                                        </div>
                                        <span className="text-gray-900 font-semibold">{equipment.health_score}%</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Critical Equipment
                                </label>
                                {isEditing ? (
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_critical || false}
                                            onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">Mark as critical</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-900">
                                        {equipment.is_critical ? (
                                            <span className="text-red-600 font-semibold">Yes</span>
                                        ) : (
                                            <span className="text-gray-500">No</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Maintenance History */}
                    <div className="card mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance History</h3>
                        {maintenanceHistory.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                No maintenance requests yet
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {maintenanceHistory.map((req) => (
                                            <tr
                                                key={req.id}
                                                onClick={() => navigate(`/request/${req.id}`)}
                                                className="hover:bg-gray-50 cursor-pointer"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900">{req.subject}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{req.category}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{req.priority}</td>
                                                <td className="px-4 py-3"><StatusBadge status={req.status} size="sm" /></td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
