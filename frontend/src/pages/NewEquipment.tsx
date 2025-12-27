import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { equipmentApi } from '../services/equipmentApi';
import { teamsApi, MaintenanceTeam } from '../services/teamsApi';
import { EquipmentCategory, EquipmentCreate } from '../types/equipment';

export const NewEquipment: React.FC = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [teams, setTeams] = useState<MaintenanceTeam[]>([]);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const data = await teamsApi.list();
            setTeams(data.items);
        } catch (err) {
            console.error('Failed to load teams', err);
        }
    };

    const [formData, setFormData] = useState<EquipmentCreate>({
        name: '',
        serial_number: '',
        category: EquipmentCategory.MACHINERY,
        department: '',
        company: 'Adani Enterprises',
        maintenance_team: '',
        maintenance_team_id: null,
        assigned_employee_id: null,
        default_technician_id: null,
        work_center: '',
        location: '',
        description: '',
        assigned_date: null,
        scrap_date: null,
        health_score: 100,
        is_critical: false,
    });

    const handleSave = async () => {
        // Validation
        if (!formData.name.trim()) {
            showToast('Please enter equipment name', 'error');
            return;
        }
        if (!formData.serial_number.trim()) {
            showToast('Please enter serial number', 'error');
            return;
        }
        if (!formData.department.trim()) {
            showToast('Please enter department', 'error');
            return;
        }

        try {
            setSaving(true);
            await equipmentApi.create(formData);
            showToast('Equipment created successfully', 'success');
            navigate('/equipment');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to create equipment';
            showToast(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
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
                <div className="max-w-6xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-6 text-sm">
                        <button onClick={() => navigate('/equipment')} className="text-primary-600 hover:underline">
                            Equipment
                        </button>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-600">New Equipment</span>
                    </nav>

                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Add New Equipment</h2>
                    </div>

                    {/* Main Form */}
                    <div className="card mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT COLUMN - Basic Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

                                {/* Equipment Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Equipment Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Forklift Model X200"
                                        required
                                    />
                                </div>

                                {/* Serial Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Serial Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.serial_number}
                                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        className="input-field font-mono"
                                        placeholder="e.g., FLX-200-001"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as EquipmentCategory })}
                                        className="input-field"
                                        required
                                    >
                                        <option value={EquipmentCategory.MACHINERY}>Machinery</option>
                                        <option value={EquipmentCategory.VEHICLE}>Vehicle</option>
                                        <option value={EquipmentCategory.TOOL}>Tool</option>
                                        <option value={EquipmentCategory.ELECTRONIC}>Electronic</option>
                                        <option value={EquipmentCategory.OTHER}>Other</option>
                                    </select>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Logistics"
                                        required
                                    />
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Adani Enterprises"
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN - Location & Maintenance */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location & Maintenance</h3>

                                {/* Maintenance Team */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maintenance Team
                                    </label>
                                    <select
                                        value={formData.maintenance_team_id || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            maintenance_team_id: e.target.value ? Number(e.target.value) : null,
                                            // Optional: also set string name for UI/backward compat if we wanted, but not strictly needed as backend handles sync
                                        })}
                                        className="input-field"
                                    >
                                        <option value="">Select Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Work Center */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Work Center
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.work_center || ''}
                                        onChange={(e) => setFormData({ ...formData, work_center: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Warehouse 1"
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location || ''}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Bay 12, Floor 2"
                                    />
                                </div>

                                {/* Technician */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Default Technician
                                    </label>
                                    <input
                                        type="text"
                                        value="To be assigned"
                                        className="input-field bg-gray-100"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Technician assignment will be implemented with user management
                                    </p>
                                </div>

                                {/* Employee / Used By */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee / Used By
                                    </label>
                                    <input
                                        type="text"
                                        value="To be assigned"
                                        className="input-field bg-gray-100"
                                        disabled
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Employee assignment will be implemented with user management
                                    </p>
                                </div>

                                {/* Assigned Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assigned Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.assigned_date || ''}
                                        onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                {/* Scrap Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scrap Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.scrap_date || ''}
                                        onChange={(e) => setFormData({ ...formData, scrap_date: e.target.value })}
                                        className="input-field"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Date when equipment was scrapped (if applicable)
                                    </p>
                                </div>

                                {/* Description */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input-field"
                                        rows={4}
                                        placeholder="Additional notes about the equipment..."
                                    />
                                </div>

                                {/* Health Score */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Health Score (0-100)
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.health_score ?? 0}
                                            onChange={(e) => setFormData({ ...formData, health_score: Number(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.health_score}
                                            onChange={(e) => setFormData({ ...formData, health_score: Number(e.target.value) })}
                                            className="input-field w-20 text-center"
                                        />
                                    </div>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${formData.health_score >= 70 ? 'bg-green-500' :
                                                formData.health_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${formData.health_score}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Critical Equipment */}
                                <div>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_critical}
                                            onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
                                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Mark as Critical Equipment
                                        </span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1 ml-8">
                                        Critical equipment receives higher priority in maintenance scheduling
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/equipment')}
                            className="btn-secondary"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            disabled={!formData.name.trim() || !formData.serial_number.trim() || !formData.department.trim() || saving}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Equipment'
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
