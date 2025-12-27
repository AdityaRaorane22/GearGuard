import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Equipment, MaintenanceRequest, RequestStage, RequestType } from "../../types";
import { getEquipmentById, getEquipmentRequests } from "../../services/equipmentService";
import api from "../../services/api";
import EquipmentForm from "./EquipmentForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useAuth } from "../../context/AuthContext";

export interface EquipmentDetailProps {
  id: string;
}

const stageOptions: { value: RequestStage | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: RequestStage.NEW, label: "New" },
  { value: RequestStage.IN_PROGRESS, label: "In Progress" },
  { value: RequestStage.REPAIRED, label: "Repaired" },
  { value: RequestStage.SCRAP, label: "Scrap" },
];

const requestTypeOptions: { value: RequestType; label: string }[] = [
  { value: RequestType.CORRECTIVE, label: "Corrective" },
  { value: RequestType.PREVENTIVE, label: "Preventive" },
];

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ id }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = !!user && (user.role === "admin" || user.role === "manager");

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stageFilter, setStageFilter] = useState<RequestStage | "">("");

  const [editOpen, setEditOpen] = useState(false);

  // Create Request dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newType, setNewType] = useState<RequestType>(RequestType.CORRECTIVE);
  const [newDescription, setNewDescription] = useState("");
  const [newScheduledDate, setNewScheduledDate] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [eq, reqs] = await Promise.all([
        getEquipmentById(id),
        getEquipmentRequests(id),
      ]);
      setEquipment(eq);
      setRequests(reqs.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredRequests = useMemo(() => {
    if (!stageFilter) return requests;
    return requests.filter((r) => r.stage === stageFilter);
  }, [requests, stageFilter]);

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!equipment) return;
    if (!newSubject.trim()) {
      setCreateError("Subject is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        subject: newSubject.trim(),
        description: newDescription.trim() || undefined,
        request_type: newType,
        equipment_id: equipment.id,
        scheduled_date: newScheduledDate || undefined,
      } as const;
      await api.post("/api/requests", payload);
      setCreateOpen(false);
      // reset
      setNewSubject("");
      setNewDescription("");
      setNewScheduledDate("");
      setNewType(RequestType.CORRECTIVE);
      await refresh();
    } catch (err: any) {
      setCreateError(err?.response?.data?.detail || "Failed to create request");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!equipment) return;
    const confirm = window.confirm("Delete this equipment? This action cannot be undone.");
    if (!confirm) return;
    try {
      await api.delete(`/api/equipment/${equipment.id}`);
      navigate("/equipment");
    } catch (err: any) {
      // fallback: try scrapping equipment if DELETE not supported
      const fallback = window.confirm(
        "Delete endpoint not available. Scrap equipment instead (mark as scrapped)?"
      );
      if (!fallback) return;
      try {
        await api.patch(`/api/equipment/${equipment.id}`, { isScrapped: true });
        await refresh();
      } catch (e2: any) {
        alert(e2?.response?.data?.detail || "Failed to delete/scrap equipment");
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }
  if (error || !equipment) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-4 py-3">
          {error || "Equipment not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{equipment.equipmentName}</h2>
          <div className="text-sm text-slate-400">Serial: {equipment.serialNumber}</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>Category: <span className="text-slate-300">{equipment.category}</span></div>
            {equipment.department && (
              <div>Department: <span className="text-slate-300">{equipment.department}</span></div>
            )}
            {equipment.location && (
              <div>Location: <span className="text-slate-300">{equipment.location}</span></div>
            )}
            {equipment.purchaseDate && (
              <div>Purchased: <span className="text-slate-300">{new Date(equipment.purchaseDate).toLocaleDateString()}</span></div>
            )}
            {equipment.warrantyExpiry && (
              <div>Warranty Expiry: <span className="text-slate-300">{new Date(equipment.warrantyExpiry).toLocaleDateString()}</span></div>
            )}
            <div>Assigned: <span className="text-slate-300">{equipment.assignedEmployee?.fullName || equipment.assignedEmployee?.username || "Unassigned"}</span></div>
            <div>Team: <span className="text-slate-300">{equipment.maintenanceTeam?.teamName || "Unassigned"}</span></div>
            {equipment.isScrapped && (
              <div className="text-rose-300">Status: Scrapped</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
          >
            New Request
          </button>
          {canManage && (
            <>
              <button
                onClick={() => setEditOpen(true)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-sm font-medium"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Requests Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold">Maintenance Requests</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Stage</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter((e.target.value as RequestStage) || "")}
              className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
            >
              {stageOptions.map((opt) => (
                <option key={opt.label} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Technician</th>
                <th className="py-2 pr-4">Scheduled</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4 max-w-[260px] truncate">{r.subject}</td>
                  <td className="py-2 pr-4">{r.requestType}</td>
                  <td className="py-2 pr-4">{r.stage}</td>
                  <td className="py-2 pr-4">{r.assignedTechnician?.fullName || r.assignedTechnician?.username || "-"}</td>
                  <td className="py-2 pr-4">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : "-"}</td>
                  <td className="py-2 pr-4">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">
                    <Link to={`/requests/${r.id}`} className="text-emerald-400 hover:text-emerald-300">Open</Link>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-slate-400" colSpan={7}>No requests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Equipment Modal */}
      {canManage && (
        <EquipmentForm
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          initial={equipment}
          onSuccess={async (updated) => {
            setEquipment(updated);
            await refresh();
          }}
        />
      )}

      {/* Create Request Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
            <DialogDescription>
              Create a maintenance request for this equipment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col sm:col-span-2">
                <label className="text-xs text-slate-400 mb-1">Subject<span className="text-rose-400">*</span></label>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Abnormal vibration"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as RequestType)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {requestTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className="text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional details"
                  rows={3}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {createError && (
              <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-3 py-2 text-sm">
                {createError}
              </div>
            )}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
              >
                {creating ? "Creating..." : "Create Request"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentDetail;
