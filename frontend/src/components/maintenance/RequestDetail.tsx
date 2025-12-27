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
import { Wrench, ClipboardCheck, AlertCircle } from "lucide-react";

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
      <div className="min-h-[50vh] grid place-items-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-4 py-3">
          {error || "Request not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{request.subject}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-xs">
              {request.requestType === "corrective" ? (
                <Wrench className="w-3 h-3" />
              ) : (
                <ClipboardCheck className="w-3 h-3" />
              )}
              {request.requestType === "corrective" ? "Corrective" : "Preventive"}
            </span>
            <span className="inline-block px-2 py-1 rounded-full bg-slate-800 text-xs capitalize">
              {request.stage}
            </span>
            {request.isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-900/30 border border-rose-800 text-xs text-rose-300">
                <AlertCircle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment */}
          {request.equipment && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-3">Equipment</h3>
              <div className="space-y-2">
                <div>
                  <Link
                    to={`/equipment/${request.equipment.id}`}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    {request.equipment.equipmentName}
                  </Link>
                </div>
                <div className="text-sm text-slate-300">
                  SN: {request.equipment.serialNumber}
                </div>
                <div className="text-sm text-slate-400">
                  Category: <span className="text-slate-300">{request.equipment.category}</span>
                </div>
                {request.equipment.department && (
                  <div className="text-sm text-slate-400">
                    Department: <span className="text-slate-300">{request.equipment.department}</span>
                  </div>
                )}
                {request.equipment.location && (
                  <div className="text-sm text-slate-400">
                    Location: <span className="text-slate-300">{request.equipment.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team & Technician */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-3">Team & Assignment</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Maintenance Team</div>
                <div className="text-sm">
                  {request.maintenanceTeam?.teamName || "Unassigned"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Assigned Technician</div>
                <div className="text-sm">
                  {request.assignedTechnician?.fullName ||
                    request.assignedTechnician?.username ||
                    "Unassigned"}
                </div>
              </div>
              {canAssignToSelf && (
                <button
                  onClick={handleAssignToSelf}
                  disabled={assigning}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
                >
                  {assigning ? "Assigning..." : "Assign to Me"}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <div className="text-sm text-slate-200 whitespace-pre-wrap">
                {request.description}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {request.scheduledDate && (
                <div>
                  <div className="text-slate-400 mb-1">Scheduled Date</div>
                  <div className="text-slate-200">
                    {new Date(request.scheduledDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {request.durationHours && (
                <div>
                  <div className="text-slate-400 mb-1">Duration</div>
                  <div className="text-slate-200">{request.durationHours} hours</div>
                </div>
              )}
              {request.createdBy && (
                <div>
                  <div className="text-slate-400 mb-1">Created By</div>
                  <div className="text-slate-200">
                    {request.createdBy.fullName || request.createdBy.username}
                  </div>
                </div>
              )}
              {request.createdAt && (
                <div>
                  <div className="text-slate-400 mb-1">Created</div>
                  <div className="text-slate-200">
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          {/* Stage Update */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-3">Update Status</h3>
            <div className="space-y-3">
              <select
                value={newStage}
                onChange={(e) => setNewStage((e.target.value as RequestStage) || "")}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select stage</option>
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleStageChange}
                disabled={!newStage || newStage === request.stage || updatingStage}
                className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
              >
                {updatingStage ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>

          {/* Complete Request */}
          {request.stage !== RequestStage.REPAIRED && request.stage !== RequestStage.SCRAP && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-3">Complete Request</h3>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-xs text-slate-400 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="e.g. 2.5"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleComplete}
                  disabled={!duration || completing}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
                >
                  {completing ? "Completing..." : "Mark as Repaired"}
                </button>
              </div>
            </div>
          )}

          {/* Errors */}
          {actionError && (
            <div className="bg-rose-900/30 border border-rose-800 rounded-lg px-3 py-2 text-sm text-rose-300">
              {actionError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
