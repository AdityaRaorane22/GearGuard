import apiClient from './api';

export interface MaintenanceTeam {
    id: number;
    name: string;
    company: string;
    members: TeamMember[];
    created_at: string;
}

export interface TeamMember {
    id: number;
    email: string;
    full_name: string;
    role: string;
}

export interface MaintenanceTeamCreate {
    name: string;
    company?: string;
    member_ids: number[];
}

export interface MaintenanceTeamUpdate {
    name?: string;
    company?: string;
    member_ids?: number[];
}

export interface MaintenanceTeamListResponse {
    items: MaintenanceTeam[];
    total: number;
}

export const teamsApi = {
    list: async (): Promise<MaintenanceTeamListResponse> => {
        const response = await apiClient.get<MaintenanceTeamListResponse>('/api/teams');
        return response.data;
    },

    get: async (id: number): Promise<MaintenanceTeam> => {
        const response = await apiClient.get<MaintenanceTeam>(`/api/teams/${id}`);
        return response.data;
    },

    create: async (data: MaintenanceTeamCreate): Promise<MaintenanceTeam> => {
        const response = await apiClient.post<MaintenanceTeam>('/api/teams', data);
        return response.data;
    },

    update: async (id: number, data: MaintenanceTeamUpdate): Promise<MaintenanceTeam> => {
        const response = await apiClient.put<MaintenanceTeam>(`/api/teams/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/teams/${id}`);
    }
};
