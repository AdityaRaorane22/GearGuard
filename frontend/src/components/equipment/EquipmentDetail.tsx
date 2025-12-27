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
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Wrench, 
  Users, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export interface EquipmentDetailProps {
  id: string;
}

const stageOptions: { value: RequestStage | ""; label: string }[] = [
  { value: "", label: "All Stages" },
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
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 animate-pulse">Loading details...</p>
        </div>
      </div>
    );
  }
  if (error || !equipment) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="bg-white border border-rose-200 text-rose-600 flex items-center gap-3 p-4 rounded-lg shadow-sm">
          <AlertCircle size={24} />
          <span>{error || "Equipment not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/equipment" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit">
          <ArrowLeft size={16} />
          <span>Back to Equipment</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{equipment.equipmentName}</h1>
              {equipment.isScrapped && (
                <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider">
                  Scrapped
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">SN: {equipment.serialNumber}</span>
              <span className="flex items-center gap-1.5 capitalize">
                <Wrench size={14} />
                {equipment.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              <span>New Request</span>
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                  title="Edit Equipment"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors"
                  title="Delete Equipment"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 h-fit shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-blue-600" />
            Equipment Details
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Department</label>
                <p className="text-slate-900 font-medium">{equipment.department || "-"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Location</label>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <MapPin size={14} className="text-slate-400" />
                  {equipment.location || "-"}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Assigned Team</label>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Users size={14} className="text-slate-400" />
                  {equipment.maintenanceTeam?.teamName || "Unassigned"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Assigned Employee</label>
                <p className="text-slate-900 font-medium">
                  {equipment.assignedEmployee?.fullName || equipment.assignedEmployee?.username || "Unassigned"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Purchased</label>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Calendar size={14} className="text-slate-400" />
                  {equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString() : "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Warranty</label>
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Clock size={14} className="text-slate-400" />
                  {equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Maintenance History</h3>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter((e.target.value as RequestStage) || "")}
              className="glass-input py-1.5 px-3 text-sm w-40"
            >
              {stageOptions.map((opt) => (
                <option key={opt.label} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredRequests.map((r) => (
              <div 
                key={r.id} 
                className="bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-blue-300 transition-all rounded-xl shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      r.stage === RequestStage.NEW ? "bg-blue-500" :
                      r.stage === RequestStage.IN_PROGRESS ? "bg-amber-500" :
                      r.stage === RequestStage.REPAIRED ? "bg-emerald-500" : "bg-rose-500"
                    }`} />
                    <h4 className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {r.subject}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] text-slate-600 border border-slate-200">
                      {r.requestType}
                    </span>
                    <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</span>
                    {r.assignedTechnician && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {r.assignedTechnician.fullName || r.assignedTechnician.username}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Status</div>
                    <div className="text-sm font-medium text-slate-700">{r.stage}</div>
                  </div>
                  <Link 
                    to={`/requests/${r.id}`}
                    className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap ml-auto sm:ml-0"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div className="bg-white border border-slate-200 p-8 rounded-xl text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                  <CheckCircle2 size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500">No maintenance requests found</p>
              </div>
            )}
          </div>
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
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">New Maintenance Request</DialogTitle>
            <DialogDescription className="text-slate-500">
              Create a maintenance request for <span className="text-slate-900 font-medium">{equipment.equipmentName}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Subject<span className="text-rose-500">*</span></label>
              <input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Abnormal vibration"
                className="glass-input w-full"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as RequestType)}
                  className="glass-input w-full appearance-none cursor-pointer"
                >
                  {requestTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Scheduled Date</label>
                <input
                  type="date"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={3}
                className="glass-input w-full resize-none"
              />
            </div>

            {createError && (
              <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <AlertTriangle size={14} />
                {createError}
              </div>
            )}
            
            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary disabled:opacity-50"
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
