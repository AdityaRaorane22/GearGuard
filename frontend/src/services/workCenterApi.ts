import axios from 'axios';
import { WorkCenter, WorkCenterCreate, WorkCenterUpdate } from '../types/workCenter';

// Base URL from environment variable or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const workCenterApi = {
    // Get all work centers
    getAll: async () => {
        const response = await api.get<WorkCenter[]>('/work-centers');
        return response.data;
    },

    // Get work center by ID
    getById: async (id: number) => {
        const response = await api.get<WorkCenter>(`/work-centers/${id}`);
        return response.data;
    },

    // Create new work center
    create: async (data: WorkCenterCreate) => {
        const response = await api.post<WorkCenter>('/work-centers', data);
        return response.data;
    },

    // Update work center
    update: async (id: number, data: WorkCenterUpdate) => {
        const response = await api.put<WorkCenter>(`/work-centers/${id}`, data);
        return response.data;
    },

    // Delete work center
    delete: async (id: number) => {
        await api.delete(`/work-centers/${id}`);
    },
};
