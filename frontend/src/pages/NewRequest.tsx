import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { StatusBadge } from '../components/StatusBadge';
import { equipmentApi } from '../services/equipmentApi';
import { maintenanceApi } from '../services/maintenanceApi';
import { teamsApi, MaintenanceTeam } from '../services/teamsApi';
import { Equipment } from '../types/equipment';
import { RequestCategory, RequestPriority, RequestStatus, MaintenanceRequestCreate, MaintenanceTargetType } from '../types/maintenance';
import { STATIC_WORK_CENTERS } from '../data/workCenters';

export const NewRequest: React.FC = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Form state
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
    const [selectedWorkCenterName, setSelectedWorkCenterName] = useState<string>('');

    // Derived state for display
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    const [activeTab, setActiveTab] = useState<'notes' | 'instructions'>('notes');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<MaintenanceRequestCreate>({
        subject: '',
        description: '',
        category: RequestCategory.CORRECTIVE,
        priority: RequestPriority.MEDIUM,
        target_type: MaintenanceTargetType.EQUIPMENT,
        equipment_id: null,
        work_center_name: null,
        technician_id: null,
        maintenance_team_id: null,
        scheduled_date: null,
        duration: null,
    });

    // Fetch lists on mount
    useEffect(() => {
        fetchEquipment();
        fetchTeams();
    }, []);

    // Auto-fill when equipment is selected
    useEffect(() => {
        if (selectedEquipmentId) {
            fetchEquipmentDetails(selectedEquipmentId);
            setFormData(prev => ({ ...prev, equipment_id: selectedEquipmentId, work_center_name: null }));
        } else {
            setSelectedEquipment(null);
            if (formData.target_type === MaintenanceTargetType.EQUIPMENT) {
                setFormData(prev => ({ ...prev, equipment_id: null }));
            }
        }
    }, [selectedEquipmentId]);

    // Auto-fill when work center is selected
    useEffect(() => {
        if (selectedWorkCenterName) {
            setFormData(prev => ({ ...prev, work_center_name: selectedWorkCenterName, equipment_id: null }));
        } else {
            if (formData.target_type === MaintenanceTargetType.WORK_CENTER) {
                setFormData(prev => ({ ...prev, work_center_name: null }));
            }
        }
    }, [selectedWorkCenterName]);

    // Handle target type change
    const handleTargetTypeChange = (type: MaintenanceTargetType) => {
        setFormData(prev => ({
            ...prev,
            target_type: type,
            equipment_id: type === MaintenanceTargetType.EQUIPMENT ? selectedEquipmentId : null,
            work_center_name: type === MaintenanceTargetType.WORK_CENTER ? selectedWorkCenterName : null
        }));
    };

    const fetchEquipment = async () => {
        try {
            const response = await equipmentApi.list({ page_size: 100 });
            setEquipment(response.items);
        } catch (err: any) {
            showToast('Failed to load equipment', 'error');
        }
    };



    const fetchTeams = async () => {
        try {
            const data = await teamsApi.list();
            setTeams(data.items);
        } catch (err) {
            console.error('Failed to load teams', err);
        }
    };

    const fetchEquipmentDetails = async (id: number) => {
        try {
            const data = await equipmentApi.get(id);
            setSelectedEquipment(data);

            // Auto-fill form data
            setFormData(prev => ({
                ...prev,
                equipment_id: id,
                technician_id: data.default_technician_id || null,
                maintenance_team_id: data.maintenance_team_id || null,
            }));
        } catch (err: any) {
            showToast('Failed to load equipment details', 'error');
        }
    };

    const handleSave = async () => {
        // Validation
        if (formData.target_type === MaintenanceTargetType.EQUIPMENT && !formData.equipment_id) {
            showToast('Please select an equipment', 'error');
            return;
        }
        if (formData.target_type === MaintenanceTargetType.WORK_CENTER && !formData.work_center_name) {
            showToast('Please select a work center', 'error');
            return;
        }

        if (!formData.subject.trim()) {
            showToast('Please enter a subject', 'error');
            return;
        }

        try {
            setSaving(true);
            await maintenanceApi.create(formData);
            showToast('Maintenance request created successfully', 'success');
            navigate('/dashboard');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Failed to create request';
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
                        <button onClick={() => navigate('/dashboard')} className="text-primary-600 hover:underline">
                            Dashboard
                        </button>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-600">New Maintenance Request</span>
                    </nav>

                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Request</h2>
                        <StatusBadge status={RequestStatus.NEW} size="lg" />
                    </div>

                    {/* Main Form */}
                    <div className="card mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT COLUMN - Request & Equipment/WorkCenter Context */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Request Details</h3>

                                {/* Target Type Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maintenance For <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-primary-600 h-4 w-4"
                                                checked={formData.target_type === MaintenanceTargetType.EQUIPMENT}
                                                onChange={() => handleTargetTypeChange(MaintenanceTargetType.EQUIPMENT)}
                                            />
                                            <span className="ml-2 text-gray-700">Equipment</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                className="form-radio text-primary-600 h-4 w-4"
                                                checked={formData.target_type === MaintenanceTargetType.WORK_CENTER}
                                                onChange={() => handleTargetTypeChange(MaintenanceTargetType.WORK_CENTER)}
                                            />
                                            <span className="ml-2 text-gray-700">Work Center</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Equipment Dropdown - Conditionally Shown */}
                                {formData.target_type === MaintenanceTargetType.EQUIPMENT && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Equipment <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedEquipmentId || ''}
                                            onChange={(e) => setSelectedEquipmentId(Number(e.target.value))}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">-- Select Equipment --</option>
                                            {equipment.map((eq) => (
                                                <option key={eq.id} value={eq.id}>
                                                    {eq.name} ({eq.serial_number})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Work Center Dropdown - Conditionally Shown */}
                                {formData.target_type === MaintenanceTargetType.WORK_CENTER && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Work Center <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedWorkCenterName}
                                            onChange={(e) => setSelectedWorkCenterName(e.target.value)}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">-- Select Work Center --</option>
                                            {STATIC_WORK_CENTERS.map((wc) => (
                                                <option key={wc.id} value={wc.name}>
                                                    {wc.name} ({wc.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Auto-filled fields (read-only) for Equipment */}
                                {selectedEquipment && formData.target_type === MaintenanceTargetType.EQUIPMENT && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Equipment Category
                                            </label>
                                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 capitalize">
                                                {selectedEquipment.category}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company
                                            </label>
                                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                                {selectedEquipment.company}
                                            </div>
                                        </div>

                                        {selectedEquipment.maintenance_team && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Maintenance Team
                                                </label>
                                                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                                    {selectedEquipment.maintenance_team}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}




                                {/* Subject - MANDATORY */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="input-field"
                                        placeholder="Brief description of the issue"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input-field"
                                        rows={4}
                                        placeholder="Detailed description of the maintenance request..."
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as RequestCategory })}
                                        className="input-field"
                                    >
                                        <option value={RequestCategory.CORRECTIVE}>Corrective</option>
                                        <option value={RequestCategory.PREVENTIVE}>Preventive</option>
                                    </select>
                                </div>
                            </div>

                            {/* RIGHT COLUMN - Assignment & Scheduling */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Assignment & Schedule</h3>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as RequestPriority })}
                                        className="input-field"
                                    >
                                        <option value={RequestPriority.LOW}>Low</option>
                                        <option value={RequestPriority.MEDIUM}>Medium</option>
                                        <option value={RequestPriority.HIGH}>High</option>
                                        <option value={RequestPriority.URGENT}>Urgent</option>
                                    </select>
                                </div>

                                {/* Scheduled Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_date || ''}
                                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                        className="input-field"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={formData.duration || ''}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value ? Number(e.target.value) : null })}
                                        className="input-field"
                                        placeholder="0.0"
                                    />
                                </div>

                                {/* Request Date (auto-filled, read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Request Date
                                    </label>
                                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                                        {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Auto-filled with current date/time</p>
                                </div>

                                {/* Assigned Technician */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assigned Technician
                                    </label>
                                    <select
                                        value={formData.technician_id || ''}
                                        onChange={(e) => setFormData({ ...formData, technician_id: e.target.value ? Number(e.target.value) : null })}
                                        className="input-field"
                                    >
                                        <option value="">To be assigned</option>
                                        {formData.maintenance_team_id
                                            ? teams.find(t => t.id === formData.maintenance_team_id)?.members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.full_name || member.email}
                                                </option>
                                            ))
                                            : null // Optionally show all users or rely on team filter
                                        }
                                        {/* If no team is selected, maybe we shouldn't show any technicians or show all? 
                                            For now, keeping it strict to team members if team is selected, 
                                            but if we want to allow picking any technician for Work Center requests (which might not have a default team), 
                                            we might need to fetch all technicians. 
                                            However, as per requirements "Team & technician assignment applies", so we assume similar logic.
                                        */}
                                    </select>
                                    {!formData.maintenance_team_id && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Select a maintenance team to filter available technicians
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="card mb-6">
                        {/* Tab Headers */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notes'
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('instructions')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'instructions'
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Instructions
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'notes' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Internal Notes
                                    </label>
                                    <textarea
                                        className="input-field"
                                        rows={6}
                                        placeholder="Add internal notes for the maintenance team..."
                                    />
                                </div>
                            )}
                            {activeTab === 'instructions' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maintenance Instructions
                                    </label>
                                    <textarea
                                        className="input-field"
                                        rows={6}
                                        placeholder="Add specific maintenance instructions or procedures..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            disabled={
                                (!selectedEquipmentId && !selectedWorkCenterName) ||
                                !formData.subject.trim() ||
                                saving
                            }
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
                                'Save Request'
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
