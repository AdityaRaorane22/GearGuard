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
    critical_equipment: {
        count: number;
        healthPercentage: number;
    };
    technician_load: {
        utilizationPercentage: number;
    };
    open_requests: {
        total: number;
        overdue: number;
    };
}

export interface MaintenanceRequestSummary {
    id: number;
    subject: string;
    employee: string;
    technician: string;
    category: string;
    status: string;
    company: string;
    scheduled_date: string | null;
    is_overdue: boolean;
}

export interface DashboardResponse {
    metrics: DashboardMetrics;
    recent_requests: MaintenanceRequestSummary[];
}
