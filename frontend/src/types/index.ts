export enum RequestStage {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  REPAIRED = "repaired",
  SCRAP = "scrap",
}

export enum RequestType {
  CORRECTIVE = "corrective",
  PREVENTIVE = "preventive",
}

export type Role = "admin" | "manager" | "technician" | "user";
export type Category = "machine" | "vehicle" | "computer" | "other";

export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string | null;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface MaintenanceTeam {
  id: string;
  teamName: string;
  specialization?: string | null;
  members?: User[];
}

export interface Equipment {
  id: string;
  equipmentName: string;
  serialNumber: string;
  category: Category;
  department?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  location?: string | null;
  isScrapped: boolean;
  assignedEmployeeId?: string | null;
  maintenanceTeamId?: string | null;
  createdAt?: string;
  maintenanceRequestsCount?: number;
  assignedEmployee?: User | null;
  maintenanceTeam?: MaintenanceTeam | null;
}

export interface MaintenanceRequest {
  id: string;
  subject: string;
  description?: string | null;
  requestType: RequestType;
  stage: RequestStage;
  equipmentId: string;
  maintenanceTeamId?: string | null;
  assignedTechnicianId?: string | null;
  durationHours?: number | null;
  scheduledDate?: string | null;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  isOverdue?: boolean;
  equipment?: Equipment | null;
  maintenanceTeam?: MaintenanceTeam | null;
  assignedTechnician?: User | null;
  createdBy?: User | null;
}
