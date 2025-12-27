import api from "./api";
import { MaintenanceRequest, RequestStage, RequestType } from "../types";

export type RequestFilters = {
  stage?: RequestStage;
  teamId?: string;
  equipmentId?: string;
  requestType?: RequestType;
  groupBy?: "stage" | "team" | "equipment";
  page?: number;
  pageSize?: number;
};

function toQueryParams(filters?: RequestFilters) {
  if (!filters) return undefined as unknown as Record<string, unknown>;
  const params: Record<string, unknown> = {};
  if (filters.stage !== undefined) params.stage = filters.stage;
  if (filters.teamId !== undefined) params.team_id = filters.teamId;
  if (filters.equipmentId !== undefined) params.equipment_id = filters.equipmentId;
  if (filters.requestType !== undefined) params.request_type = filters.requestType;
  if (filters.groupBy !== undefined) params.group_by = filters.groupBy;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  return params;
}

export async function getRequests(filters?: RequestFilters): Promise<{
  data: MaintenanceRequest[];
  total?: number;
}> {
  const res = await api.get<MaintenanceRequest[]>("/api/requests", {
    params: toQueryParams(filters),
  });
  const totalHeader = res.headers["x-total-count"] || res.headers["X-Total-Count"];
  const total = totalHeader ? Number(totalHeader) : undefined;
  return { data: res.data, total };
}

export async function getRequestById(id: string): Promise<MaintenanceRequest> {
  const res = await api.get<MaintenanceRequest>(`/api/requests/${id}`);
  return res.data;
}

export type RequestCreate = {
  subject: string;
  description?: string | null;
  request_type: RequestType;
  equipment_id: string;
  maintenance_team_id?: string | null;
  scheduled_date?: string | null; // ISO date string (YYYY-MM-DD)
};

export async function createRequest(data: RequestCreate): Promise<MaintenanceRequest> {
  const res = await api.post<MaintenanceRequest>("/api/requests", data);
  return res.data;
}

export async function updateRequestStage(id: string, stage: RequestStage): Promise<MaintenanceRequest> {
  const res = await api.patch<MaintenanceRequest>(`/api/requests/${id}/stage`, { stage });
  return res.data;
}

export async function assignTechnician(id: string, technicianId: string): Promise<MaintenanceRequest> {
  const res = await api.patch<MaintenanceRequest>(`/api/requests/${id}/assign`, { technician_id: technicianId });
  return res.data;
}

export async function completeRequest(id: string, durationHours: number): Promise<MaintenanceRequest> {
  const res = await api.patch<MaintenanceRequest>(`/api/requests/${id}/complete`, { duration_hours: durationHours });
  return res.data;
}
