import apiClient from './api';
import {
    Equipment,
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentListResponse
} from '../types/equipment';

export const equipmentApi = {
    /**
     * List all equipment with pagination and filters
     */
    list: async (params?: {
        page?: number;
        page_size?: number;
        search?: string;
        category?: string;
        is_critical?: boolean;
    }): Promise<EquipmentListResponse> => {
        const response = await apiClient.get<EquipmentListResponse>('/api/equipment', { params });
        return response.data;
    },

    /**
     * Get equipment by ID
     */
    get: async (id: number): Promise<Equipment> => {
        const response = await apiClient.get<Equipment>(`/api/equipment/${id}`);
        return response.data;
    },

    /**
     * Create new equipment
     */
    create: async (data: EquipmentCreate): Promise<Equipment> => {
        const response = await apiClient.post<Equipment>('/api/equipment', data);
        return response.data;
    },

    /**
     * Update equipment
     */
    update: async (id: number, data: EquipmentUpdate): Promise<Equipment> => {
        const response = await apiClient.put<Equipment>(`/api/equipment/${id}`, data);
        return response.data;
    },

    /**
     * Delete equipment
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/equipment/${id}`);
    },
};
