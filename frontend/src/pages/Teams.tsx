import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { teamsApi, MaintenanceTeam } from '../services/teamsApi';

export const Teams: React.FC = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const data = await teamsApi.list();
            setTeams(data.items);
        } catch (err) {
            console.error('Failed to fetch teams', err);
            showToast('Failed to load teams', 'error');
        } finally {
            setLoading(false);
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
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Maintenance Teams</h2>
                        {(user?.role === 'Manager' || user?.role === 'Admin') && (
                            <button
                                onClick={() => navigate('/teams/new')}
                                className="btn-primary"
                            >
                                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Team
                            </button>
                        )}
                    </div>

                    {/* Teams Table */}
                    <div className="card overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Team Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Members
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            Loading teams...
                                        </td>
                                    </tr>
                                ) : teams.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No teams found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    teams.map((team) => (
                                        <tr
                                            key={team.id}
                                            onClick={() => navigate(`/teams/${team.id}`)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{team.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    {team.members.length > 0
                                                        ? team.members.map(m => m.full_name).join(', ')
                                                        : <span className="text-gray-400 italic">No members assigned</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{team.company}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/teams/${team.id}`);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
