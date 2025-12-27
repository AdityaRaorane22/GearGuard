import React, { useEffect, useMemo, useState } from "react";
import { Equipment, MaintenanceRequest, RequestType } from "../../types";
import { createRequest } from "../../services/maintenanceService";
import api from "../../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Search } from "lucide-react";

export type RequestFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEquipmentId?: string;
  onSuccess?: (request: MaintenanceRequest) => void;
};

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: RequestType.CORRECTIVE, label: "Corrective" },
  { value: RequestType.PREVENTIVE, label: "Preventive" },
];

const RequestForm: React.FC<RequestFormProps> = ({
  open,
  onOpenChange,
  initialEquipmentId,
  onSuccess,
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [requestType, setRequestType] = useState<RequestType>(RequestType.CORRECTIVE);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load equipment on open
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function loadEquipment() {
      try {
        const res = await api.get<Equipment[]>("/api/equipment", {
          params: { page_size: 1000 },
        });
        if (!mounted) return;
        setEquipment(res.data || []);
        // If initialEquipmentId provided, select it
        if (initialEquipmentId) {
          const found = res.data.find((e) => e.id === initialEquipmentId);
          if (found) setSelectedEquipment(found);
        }
      } catch (e: any) {
        // ignore
      }
    }
    loadEquipment();
    return () => {
      mounted = false;
    };
  }, [open, initialEquipmentId]);

  // Reset form on close
  useEffect(() => {
    if (open) return;
    setEquipmentSearch("");
    if (!initialEquipmentId) setSelectedEquipment(null);
    setRequestType(RequestType.CORRECTIVE);
    setSubject("");
    setDescription("");
    setScheduledDate("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  // Filter equipment by search
  const filteredEquipment = useMemo(() => {
    if (!equipmentSearch.trim()) return equipment;
    const q = equipmentSearch.toLowerCase();
    return equipment.filter(
      (e) =>
        e.equipmentName.toLowerCase().includes(q) ||
        e.serialNumber.toLowerCase().includes(q)
    );
  }, [equipment, equipmentSearch]);

  const canSubmit = useMemo(() => {
    return (
      selectedEquipment &&
      subject.trim().length >= 3 &&
      (requestType === RequestType.CORRECTIVE || !!scheduledDate)
    );
  }, [selectedEquipment, subject, requestType, scheduledDate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedEquipment) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createRequest({
        subject: subject.trim(),
        description: description.trim() || null,
        request_type: requestType,
        equipment_id: selectedEquipment.id,
        maintenance_team_id: selectedEquipment.maintenanceTeamId || null,
        scheduled_date:
          requestType === RequestType.PREVENTIVE ? (scheduledDate || null) : null,
      });
      if (onSuccess) onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
          <DialogDescription>
            Create a new maintenance request for your equipment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          {/* Equipment Dropdown */}
          <div className="relative flex flex-col">
            <label className="text-xs text-slate-400 mb-1">
              Equipment<span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder={
                  selectedEquipment
                    ? selectedEquipment.equipmentName
                    : "Search equipment..."
                }
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {equipmentSearch && filteredEquipment.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredEquipment.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setSelectedEquipment(e);
                      setEquipmentSearch("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-b-0"
                  >
                    <div className="font-medium text-sm">{e.equipmentName}</div>
                    <div className="text-xs text-slate-400">
                      SN: {e.serialNumber} • {e.category}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Equipment Info */}
          {selectedEquipment && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <div className="text-slate-400 mb-0.5">Category</div>
                <div className="font-medium capitalize">{selectedEquipment.category}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <div className="text-slate-400 mb-0.5">Department</div>
                <div className="font-medium">
                  {selectedEquipment.department || "N/A"}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <div className="text-slate-400 mb-0.5">Assigned Team</div>
                <div className="font-medium">
                  {selectedEquipment.maintenanceTeam?.teamName || "Unassigned"}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Request Type */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">
                Request Type<span className="text-rose-400">*</span>
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestType)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {REQUEST_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Date (Preventive only) */}
            {requestType === RequestType.PREVENTIVE && (
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1">
                  Scheduled Date<span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={requestType === RequestType.PREVENTIVE}
                />
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">
              Subject<span className="text-rose-400">*</span>
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Abnormal vibration detected"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the request..."
              rows={3}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              {submitting ? "Creating..." : "Create Request"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestForm;
