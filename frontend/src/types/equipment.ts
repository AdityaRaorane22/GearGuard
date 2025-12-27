export enum EquipmentCategory {
    MACHINERY = 'machinery',
    VEHICLE = 'vehicle',
    TOOL = 'tool',
    ELECTRONIC = 'electronic',
    OTHER = 'other'
}

export interface Equipment {
    id: number;
    name: string;
    serial_number: string;
    category: EquipmentCategory;
    department: string;
    company: string;
    maintenance_team: string | null;
    maintenance_team_id?: number | null;
    assigned_employee_id: number | null;
    default_technician_id: number | null;
    work_center: string | null;
    location: string | null;
    description: string | null;
    assigned_date: string | null;
    scrap_date: string | null;
    is_critical: boolean;
    health_score: number;
    created_at: string;
    updated_at: string;
}

export interface EquipmentCreate {
    name: string;
    serial_number: string;
    category: EquipmentCategory;
    department: string;
    company?: string;
    maintenance_team?: string | null;
    maintenance_team_id?: number | null;
    assigned_employee_id?: number | null;
    default_technician_id?: number | null;
    work_center?: string | null;
    location?: string | null;
    description?: string | null;
    assigned_date?: string | null;
    scrap_date?: string | null;
    is_critical?: boolean;
    health_score?: number;
}

export interface EquipmentUpdate {
    name?: string;
    serial_number?: string;
    category?: EquipmentCategory;
    department?: string;
    company?: string;
    maintenance_team?: string | null;
    maintenance_team_id?: number | null;
    assigned_employee_id?: number | null;
    default_technician_id?: number | null;
    work_center?: string | null;
    location?: string | null;
    description?: string | null;
    assigned_date?: string | null;
    scrap_date?: string | null;
    is_critical?: boolean;
    health_score?: number;
}

export interface EquipmentListResponse {
    items: Equipment[];
    total: number;
    page: number;
    page_size: number;
}
