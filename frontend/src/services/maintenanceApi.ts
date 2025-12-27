import apiClient from './api';
import {
    MaintenanceRequest,
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate
} from '../types/maintenance';

interface MaintenanceListParams {
    equipment_id?: number;
    page?: number;
    page_size?: number;
}

interface MaintenanceListResponse {
    items: MaintenanceRequest[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export const maintenanceApi = {
    /**
     * List maintenance requests with optional filters
     */
    list: async (params?: MaintenanceListParams): Promise<MaintenanceListResponse> => {
        const response = await apiClient.get<MaintenanceListResponse>('/api/maintenance', { params });
        return response.data;
    },

    /**
     * Create a new maintenance request
     */
    create: async (data: MaintenanceRequestCreate): Promise<MaintenanceRequest> => {
        const response = await apiClient.post<MaintenanceRequest>('/api/maintenance', data);
        return response.data;
    },

    /**
     * Get maintenance request by ID
     */
    get: async (id: number): Promise<MaintenanceRequest> => {
        const response = await apiClient.get<MaintenanceRequest>(`/api/maintenance/${id}`);
        return response.data;
    },

    /**
     * Update maintenance request
     */
    update: async (id: number, data: MaintenanceRequestUpdate): Promise<MaintenanceRequest> => {
        const response = await apiClient.put<MaintenanceRequest>(`/api/maintenance/${id}`, data);
        return response.data;
    },
};
