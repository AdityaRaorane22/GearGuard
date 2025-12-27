import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { teamsApi, MaintenanceTeamCreate } from '../services/teamsApi';
import { userApi } from '../services/userApi';
import { User } from '../types/auth';

export const TeamForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    const [formData, setFormData] = useState<MaintenanceTeamCreate>({
        name: '',
        company: 'Adani Enterprises',
        member_ids: [],
    });

    useEffect(() => {
        fetchUsers();
        if (isEditMode) {
            fetchTeam();
        }
    }, [id]);

    const fetchUsers = async () => {
        try {
            // Technically we might want to filter only Technicians, but listing all for now is safer/flexible
            const data = await userApi.list();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
            showToast('Failed to load users list', 'error');
        }
    };

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const team = await teamsApi.get(Number(id));
            setFormData({
                name: team.name,
                company: team.company,
                member_ids: team.members.map(m => m.id),
            });
        } catch (err) {
            console.error('Failed to fetch team', err);
            showToast('Failed to load team details', 'error');
            navigate('/teams');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast('Team name is required', 'error');
            return;
        }

        try {
            setSaving(true);
            if (isEditMode) {
                await teamsApi.update(Number(id), formData);
                showToast('Team updated successfully', 'success');
            } else {
                await teamsApi.create(formData);
                showToast('Team created successfully', 'success');
            }
            navigate('/teams');
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Failed to save team';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleMember = (userId: number) => {
        setFormData(prev => {
            const current = prev.member_ids;
            if (current.includes(userId)) {
                return { ...prev, member_ids: current.filter(id => id !== userId) };
            } else {
                return { ...prev, member_ids: [...current, userId] };
            }
        });
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
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

            <Navigation />

            <main className="px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-6 text-sm">
                        <button onClick={() => navigate('/teams')} className="text-primary-600 hover:underline">
                            Maintenance Teams
                        </button>
                        <span className="mx-2 text-gray-400">/</span>
                        <span className="text-gray-600">{isEditMode ? 'Edit Team' : 'New Team'}</span>
                    </nav>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isEditMode ? 'Edit Maintenance Team' : 'Create Maintenance Team'}
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Team Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Team Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g., Internal Maintenance"
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

                            {/* Members Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Team Members
                                </label>
                                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto divide-y divide-gray-100">
                                    {users.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">No users available</div>
                                    ) : (
                                        users.map(u => (
                                            <div
                                                key={u.id}
                                                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${formData.member_ids.includes(u.id) ? 'bg-blue-50' : ''}`}
                                                onClick={() => toggleMember(u.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.member_ids.includes(u.id)}
                                                    onChange={() => { }} // Handled by div click
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.role} &bull; {u.email}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Select users to assign to this team. Only team members can be assigned to maintenance requests for equipment owned by this team.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => navigate('/teams')}
                                className="btn-secondary"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                disabled={saving || !formData.name.trim()}
                            >
                                {saving ? 'Saving...' : 'Save Team'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
