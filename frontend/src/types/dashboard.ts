export enum RequestStatus {
    NEW = 'new',
    IN_PROGRESS = 'in_progress',
    REPAIRED = 'repaired',
    SCRAP = 'scrap'
}

export enum RequestCategory {
    CORRECTIVE = 'corrective',
    PREVENTIVE = 'preventive'
}

export interface DashboardMetrics {
    criticalEquipment: {
        count: number;
        healthPercentage: number;
    };
    technicianLoad: {
        utilizationPercentage: number;
    };
    openRequests: {
        total: number;
        overdue: number;
    };
}

export interface MaintenanceRequestSummary {
    id: number;
    subject: string;
    employee: string;
    technician: string;
    category: RequestCategory;
    status: RequestStatus;
    company: string;
    scheduledDate: string;
    isOverdue: boolean;
}

export interface DashboardResponse {
    metrics: DashboardMetrics;
    recentRequests: MaintenanceRequestSummary[];
}
