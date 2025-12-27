export interface WorkCenter {
    id: number;
    name: string;
    code: string;
    tags?: string[];
    alternative_work_centers?: number[];
    cost_per_hour?: number;
    capacity?: number;
    time_efficiency?: number;
    oee_target?: number;
    created_at: string;
    updated_at: string;
}

export interface WorkCenterCreate {
    name: string;
    code: string;
    tags?: string[];
    alternative_work_centers?: number[];
    cost_per_hour?: number;
    capacity?: number;
    time_efficiency?: number;
    oee_target?: number;
}

export interface WorkCenterUpdate {
    name?: string;
    code?: string;
    tags?: string[];
    alternative_work_centers?: number[];
    cost_per_hour?: number;
    capacity?: number;
    time_efficiency?: number;
    oee_target?: number;
}
