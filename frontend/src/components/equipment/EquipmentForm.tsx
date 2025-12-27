import React, { useEffect, useMemo, useState } from "react";
import { Category, Equipment, MaintenanceTeam, User } from "../../types";
import { createEquipment, updateEquipment, EquipmentCreate, EquipmentUpdate } from "../../services/equipmentService";
import api from "../../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type EquipmentFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initial?: Partial<Equipment> & { id?: string };
  onSuccess?: (equipment: Equipment) => void;
};

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "machine", label: "Machine" },
  { value: "vehicle", label: "Vehicle" },
  { value: "computer", label: "Computer" },
  { value: "other", label: "Other" },
];

const EquipmentForm: React.FC<EquipmentFormProps> = ({ open, onOpenChange, mode = "create", initial, onSuccess }) => {
  const [equipmentName, setEquipmentName] = useState(initial?.equipmentName || "");
  const [serialNumber, setSerialNumber] = useState(initial?.serialNumber || "");
  const [category, setCategory] = useState<Category | "">((initial?.category as Category) || "");
  const [department, setDepartment] = useState(initial?.department || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [purchaseDate, setPurchaseDate] = useState<string>(initial?.purchaseDate || "");
  const [warrantyExpiry, setWarrantyExpiry] = useState<string>(initial?.warrantyExpiry || "");

  const [maintenanceTeamId, setMaintenanceTeamId] = useState<string>(initial?.maintenanceTeamId || "");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(initial?.assignedEmployeeId || "");

  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load teams when modal opens
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function loadTeams() {
      try {
        const res = await api.get<MaintenanceTeam[]>("/api/teams");
        if (!mounted) return;
        setTeams(res.data || []);
      } catch (e: any) {
        // ignore for now; will show empty list
      }
    }
    loadTeams();
    return () => {
      mounted = false;
    };
  }, [open]);

  // Load team members when maintenanceTeamId changes
  useEffect(() => {
    if (!maintenanceTeamId) {
      setTeamMembers([]);
      // only keep assignedEmployeeId if it matches one of members; otherwise clear
      setAssignedEmployeeId("");
      return;
    }
    let mounted = true;
    async function loadTeamDetail() {
      try {
        const res = await api.get<MaintenanceTeam>(`/api/teams/${maintenanceTeamId}`);
        if (!mounted) return;
        setTeamMembers(res.data.members || []);
        if (res.data.members && res.data.members.length > 0) {
          const exists = res.data.members.some((m) => m.id === assignedEmployeeId);
          if (!exists) setAssignedEmployeeId("");
        } else {
          setAssignedEmployeeId("");
        }
      } catch (e: any) {
        if (!mounted) return;
        setTeamMembers([]);
        setAssignedEmployeeId("");
      }
    }
    loadTeamDetail();
    return () => {
      mounted = false;
    };
  }, [maintenanceTeamId]);

  useEffect(() => {
    if (open) return; // when closing, do nothing
    // Reset on close to initial when dialog closes
    setEquipmentName(initial?.equipmentName || "");
    setSerialNumber(initial?.serialNumber || "");
    setCategory((initial?.category as Category) || "");
    setDepartment(initial?.department || "");
    setLocation(initial?.location || "");
    setPurchaseDate(initial?.purchaseDate || "");
    setWarrantyExpiry(initial?.warrantyExpiry || "");
    setMaintenanceTeamId(initial?.maintenanceTeamId || "");
    setAssignedEmployeeId(initial?.assignedEmployeeId || "");
    setError(null);
    setSubmitting(false);
  }, [open]);

  const title = mode === "create" ? "Create Equipment" : "Edit Equipment";
  const description = mode === "create" ? "Add a new equipment entry to your inventory." : "Update the equipment details.";

  const canSubmit = useMemo(() => {
    return (
      equipmentName.trim().length >= 2 &&
      serialNumber.trim().length >= 2 &&
      !!category
    );
  }, [equipmentName, serialNumber, category]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: EquipmentCreate | EquipmentUpdate = {
        equipmentName: equipmentName.trim(),
        serialNumber: serialNumber.trim(),
        category: category as Category,
        department: department.trim() || null,
        location: location.trim() || null,
        purchaseDate: purchaseDate || null,
        warrantyExpiry: warrantyExpiry || null,
        maintenanceTeamId: maintenanceTeamId || null,
        assignedEmployeeId: assignedEmployeeId || null,
      };

      let result: Equipment;
      if (mode === "edit" && initial?.id) {
        result = await updateEquipment(initial.id, payload as EquipmentUpdate);
      } else {
        result = await createEquipment(payload as EquipmentCreate);
      }
      if (onSuccess) onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Name<span className="text-rose-400">*</span></label>
              <input
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="e.g. CNC Lathe"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Serial Number<span className="text-rose-400">*</span></label>
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-123456"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Category<span className="text-rose-400">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory((e.target.value as Category) || "")}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Production"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bay A"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate || ""}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={warrantyExpiry || ""}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Maintenance Team</label>
              <select
                value={maintenanceTeamId}
                onChange={(e) => setMaintenanceTeamId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Unassigned</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.teamName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Assign Employee</label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={!maintenanceTeamId || teamMembers.length === 0}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName || m.username}</option>
                ))}
              </select>
              {!maintenanceTeamId && (
                <span className="text-[10px] text-slate-500 mt-1">Select a maintenance team to choose from its members.</span>
              )}
            </div>
          </div>

          {error && (
            <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
            >
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentForm;
