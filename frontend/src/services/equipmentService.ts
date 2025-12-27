import api from "./api";
import { Category, Equipment, MaintenanceRequest } from "../types";

export type EquipmentFilters = {
  search?: string;
  category?: Category;
  department?: string;
  maintenanceTeamId?: string;
  assignedEmployeeId?: string;
  isScrapped?: boolean;
  page?: number;
  pageSize?: number;
};

export type EquipmentCreate = {
  equipmentName: string;
  serialNumber: string;
  category: Category;
  department?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  location?: string | null;
  assignedEmployeeId?: string | null;
  maintenanceTeamId?: string | null;
};

export type EquipmentUpdate = Partial<
  EquipmentCreate & {
    isScrapped: boolean;
  }
>;

function toQueryParams(filters?: EquipmentFilters) {
  if (!filters) return undefined as unknown as Record<string, unknown>;
  const params: Record<string, unknown> = {};
  if (filters.search !== undefined) params.search = filters.search;
  if (filters.category !== undefined) params.category = filters.category;
  if (filters.department !== undefined) params.department = filters.department;
  if (filters.maintenanceTeamId !== undefined)
    params.maintenance_team_id = filters.maintenanceTeamId;
  if (filters.assignedEmployeeId !== undefined)
    params.assigned_employee_id = filters.assignedEmployeeId;
  if (filters.isScrapped !== undefined) params.is_scrapped = filters.isScrapped;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  return params;
}

export async function getEquipments(filters?: EquipmentFilters): Promise<{
  data: Equipment[];
  total?: number;
}> {
  const res = await api.get<Equipment[]>("/api/equipment", {
    params: toQueryParams(filters),
  });
  const totalHeader = res.headers["x-total-count"] || res.headers["X-Total-Count"];
  const total = totalHeader ? Number(totalHeader) : undefined;
  return { data: res.data, total };
}

export async function getEquipmentById(id: string): Promise<Equipment> {
  const res = await api.get<Equipment>(`/api/equipment/${id}`);
  return res.data;
}

export async function createEquipment(data: EquipmentCreate): Promise<Equipment> {
  const res = await api.post<Equipment>("/api/equipment", data);
  return res.data;
}

export async function updateEquipment(
  id: string,
  data: EquipmentUpdate
): Promise<Equipment> {
  const res = await api.patch<Equipment>(`/api/equipment/${id}`, data);
  return res.data;
}

export async function getEquipmentRequests(
  id: string
): Promise<{
  data: MaintenanceRequest[];
  total?: number;
  open?: number;
  overdue?: number;
}> {
  const res = await api.get<MaintenanceRequest[]>(
    `/api/equipment/${id}/maintenance-requests`
  );
  const totalHeader = res.headers["x-total-count"] || res.headers["X-Total-Count"];
  const openHeader = res.headers["x-open-count"] || res.headers["X-Open-Count"];
  const overdueHeader = res.headers["x-overdue-count"] || res.headers["X-Overdue-Count"];
  return {
    data: res.data,
    total: totalHeader ? Number(totalHeader) : undefined,
    open: openHeader ? Number(openHeader) : undefined,
    overdue: overdueHeader ? Number(overdueHeader) : undefined,
  };
}
