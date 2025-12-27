import apiClient from './api';
import { User } from '../types/auth';

export const userApi = {
    list: async (role?: string): Promise<User[]> => {
        const params = role ? { role } : {};
        const response = await apiClient.get<User[]>('/api/users', { params });
        return response.data;
    }
};
