import apiClient from './api';
import { DashboardResponse } from '../types/dashboard';

export const dashboardApi = {
    /**
     * Fetch dashboard metrics and recent maintenance requests
     */
    getDashboardData: async (searchQuery?: string): Promise<DashboardResponse> => {
        const params = searchQuery ? { search: searchQuery } : {};
        const response = await apiClient.get<DashboardResponse>('/api/dashboard/metrics', { params });
        return response.data;
    },
};
