import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MaintenanceRequest, RequestStage } from "../../types";
import {
  getRequestById,
  updateRequestStage,
  assignTechnician,
  completeRequest,
} from "../../services/maintenanceService";
import { useAuth } from "../../context/AuthContext";
import { 
  Wrench, 
  ClipboardCheck, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  User, 
  Users, 
  CheckCircle2, 
  Activity 
} from "lucide-react";

export interface RequestDetailProps {
  id: string;
}

const STAGE_OPTIONS: { value: RequestStage; label: string }[] = [
  { value: RequestStage.NEW, label: "New" },
  { value: RequestStage.IN_PROGRESS, label: "In Progress" },
  { value: RequestStage.REPAIRED, label: "Repaired" },
  { value: RequestStage.SCRAP, label: "Scrap" },
];

const RequestDetail: React.FC<RequestDetailProps> = ({ id }) => {
  const { user } = useAuth();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updatingStage, setUpdatingStage] = useState(false);
  const [newStage, setNewStage] = useState<RequestStage | "">(
    request?.stage || ""
  );

  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [duration, setDuration] = useState<number | "">(request?.durationHours || "");

  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getRequestById(id);
        if (!mounted) return;
        setRequest(data);
        setNewStage(data.stage);
        if (data.durationHours) setDuration(data.durationHours);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || "Failed to load request");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Check if current user is in the assigned team
  const canAssignToSelf = useMemo(() => {
    if (!user || !request) return false;
    if (request.assignedTechnicianId === user.id) return false; // already assigned
    if (!request.maintenanceTeam) return false;
    return request.maintenanceTeam.members?.some((m) => m.id === user.id) ?? false;
  }, [user, request]);

  async function handleStageChange() {
    if (!request || !newStage || newStage === request.stage) return;
    setUpdatingStage(true);
    setActionError(null);
    try {
      const updated = await updateRequestStage(request.id, newStage);
      setRequest(updated);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.detail || "Failed to update stage"
      );
    } finally {
      setUpdatingStage(false);
    }
  }

  async function handleAssignToSelf() {
    if (!request || !user) return;
    setAssigning(true);
    setActionError(null);
    try {
      const updated = await assignTechnician(request.id, user.id);
      setRequest(updated);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.detail || "Failed to assign technician"
      );
    } finally {
      setAssigning(false);
    }
  }

  async function handleComplete() {
    if (!request || !duration) return;
    setCompleting(true);
    setActionError(null);
    try {
      const updated = await completeRequest(
        request.id,
        typeof duration === "number" ? duration : Number(duration)
      );
      setRequest(updated);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.detail || "Failed to complete request"
      );
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 animate-pulse">Loading request...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="bg-white border border-rose-200 text-rose-600 flex items-center gap-3 p-4 rounded-lg shadow-sm">
          <AlertCircle size={24} />
          <span>{error || "Request not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/requests" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit">
          <ArrowLeft size={16} />
          <span>Back to Board</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                request.requestType === "corrective" 
                  ? "bg-rose-50 text-rose-600 border border-rose-200" 
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              }`}>
                {request.requestType === "corrective" ? <Wrench size={12} /> : <ClipboardCheck size={12} />}
                {request.requestType}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                request.stage === RequestStage.NEW ? "bg-blue-50 text-blue-600 border-blue-200" :
                request.stage === RequestStage.IN_PROGRESS ? "bg-amber-50 text-amber-600 border-amber-200" :
                request.stage === RequestStage.REPAIRED ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                "bg-rose-50 text-rose-600 border-rose-200"
              }`}>
                {request.stage}
              </span>
              {request.isOverdue && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Overdue
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{request.subject}</h1>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Card */}
          {request.equipment && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-blue-600" />
                Equipment Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Name</label>
                  <Link
                    to={`/equipment/${request.equipment.id}`}
                    className="block text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {request.equipment.equipmentName}
                  </Link>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Serial Number</label>
                  <p className="text-slate-900 font-mono">{request.equipment.serialNumber}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Location</label>
                  <p className="text-slate-900">{request.equipment.location || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Department</label>
                  <p className="text-slate-900">{request.equipment.department || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description Card */}
          {request.description && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-blue-600" />
                Description
              </h3>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {request.description}
              </div>
            </div>
          )}

          {/* Assignment Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Team & Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Maintenance Team</label>
                <div className="flex items-center gap-2 text-slate-900">
                  <Users size={16} className="text-slate-400" />
                  {request.maintenanceTeam?.teamName || "Unassigned"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Assigned Technician</label>
                <div className="flex items-center gap-2 text-slate-900">
                  <User size={16} className="text-slate-400" />
                  {request.assignedTechnician?.fullName || request.assignedTechnician?.username || "Unassigned"}
                </div>
                {canAssignToSelf && (
                  <button
                    onClick={handleAssignToSelf}
                    disabled={assigning}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    {assigning ? "Assigning..." : "Assign to me"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions & Meta */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Actions
            </h3>

            {/* Stage Update */}
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Update Status</label>
              <div className="flex gap-2">
                <select
                  value={newStage}
                  onChange={(e) => setNewStage((e.target.value as RequestStage) || "")}
                  className="glass-input flex-1 py-2 px-3 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select stage</option>
                  {STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleStageChange}
                  disabled={!newStage || newStage === request.stage || updatingStage}
                  className="btn-primary py-2 px-3 text-sm disabled:opacity-50"
                >
                  {updatingStage ? "..." : "Update"}
                </button>
              </div>
            </div>

            {/* Complete Request */}
            {request.stage !== RequestStage.REPAIRED && request.stage !== RequestStage.SCRAP && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs text-slate-500 uppercase tracking-wider">Complete Request</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={duration}
                      onChange={(e) =>
                        setDuration(e.target.value ? Number(e.target.value) : "")
                      }
                      placeholder="Duration (hours)"
                      className="glass-input w-full pl-9 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={!duration || completing}
                    className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    {completing ? "Completing..." : "Mark as Repaired"}
                  </button>
                </div>
              </div>
            )}

            {/* Errors */}
            {actionError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-600 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {actionError}
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Timeline
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-900 font-medium">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Scheduled</span>
                <span className="text-slate-900 font-medium">
                  {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : "-"}
                </span>
              </div>
              {request.durationHours && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="text-slate-900 font-medium">{request.durationHours} hrs</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created By</div>
                <div className="flex items-center gap-2 text-slate-900 text-sm font-medium">
                  <User size={14} className="text-slate-400" />
                  {request.createdBy?.fullName || request.createdBy?.username || "Unknown"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
