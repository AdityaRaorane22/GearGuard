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

export enum RequestPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum MaintenanceTargetType {
    EQUIPMENT = 'equipment',
    WORK_CENTER = 'work_center',
}


export interface MaintenanceRequest {
    id: number;
    subject: string;
    description?: string;
    category: RequestCategory;
    priority: RequestPriority;

    target_type: MaintenanceTargetType;
    equipment_id?: number;
    work_center_name?: string;

    requester_id: number;
    technician_id?: number;
    maintenance_team_id?: number;
    status: RequestStatus;
    scheduled_date?: string;
    completion_date?: string;
    duration?: number;
    created_at: string;
    updated_at: string;
    company: string;
}

export interface MaintenanceRequestCreate {
    subject: string;
    description?: string;
    category: RequestCategory;
    priority: RequestPriority;

    target_type: MaintenanceTargetType;
    equipment_id?: number | null;
    work_center_name?: string | null;

    technician_id?: number | null;
    maintenance_team_id?: number | null;
    scheduled_date?: string | null;
    duration?: number | null; // Duration in hours
}

export interface MaintenanceRequestUpdate {
    subject?: string;
    description?: string;
    category?: RequestCategory;
    status?: RequestStatus;
    priority?: RequestPriority;
    technician_id?: number | null;
    maintenance_team_id?: number | null;
    scheduled_date?: string | null;
    completion_date?: string | null;
}
