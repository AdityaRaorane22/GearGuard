import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { MaintenanceRequest, RequestStage, MaintenanceTeam, Equipment } from "../types";
import { getRequests, updateRequestStage } from "../services/maintenanceService";
import api from "../services/api";
import { AlertCircle } from "lucide-react";

const STAGES: { value: RequestStage; label: string }[] = [
  { value: RequestStage.NEW, label: "New" },
  { value: RequestStage.IN_PROGRESS, label: "In Progress" },
  { value: RequestStage.REPAIRED, label: "Repaired" },
  { value: RequestStage.SCRAP, label: "Scrap" },
];

const MaintenanceRequests: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Load teams and equipment for filters
  useEffect(() => {
    let mounted = true;
    async function loadFilters() {
      try {
        const [teamsRes, equipRes] = await Promise.all([
          api.get<MaintenanceTeam[]>("/api/teams"),
          api.get<Equipment[]>("/api/equipment", { params: { page_size: 1000 } }),
        ]);
        if (!mounted) return;
        setTeams(teamsRes.data || []);
        setEquipment(equipRes.data || []);
      } catch (e: any) {
        // ignore
      }
    }
    loadFilters();
    return () => {
      mounted = false;
    };
  }, []);

  // Load requests
  useEffect(() => {
    let mounted = true;
    async function loadRequests() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getRequests({
          teamId: teamFilter || undefined,
          equipmentId: equipmentFilter || undefined,
          pageSize: 1000,
        });
        if (!mounted) return;
        setRequests(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || "Failed to load requests");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    loadRequests();
    return () => {
      mounted = false;
    };
  }, [teamFilter, equipmentFilter]);

  // Group requests by stage
  const grouped = useMemo(() => {
    const map: Record<RequestStage, MaintenanceRequest[]> = {
      [RequestStage.NEW]: [],
      [RequestStage.IN_PROGRESS]: [],
      [RequestStage.REPAIRED]: [],
      [RequestStage.SCRAP]: [],
    };
    requests.forEach((r) => {
      map[r.stage].push(r);
    });
    return map;
  }, [requests]);

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStage = destination.droppableId as RequestStage;
    const request = requests.find((r) => r.id === draggableId);
    if (!request || request.stage === newStage) return;

    setUpdating(draggableId);
    try {
      const updated = await updateRequestStage(draggableId, newStage);
      setRequests((prev) =>
        prev.map((r) => (r.id === draggableId ? updated : r))
      );
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Failed to update stage";
      alert(msg);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
          <div className="flex flex-col flex-1">
            <label className="text-xs text-slate-400 mb-1">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.teamName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-xs text-slate-400 mb-1">Equipment</label>
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Equipment</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>{e.equipmentName}</option>
              ))}
            </select>
          </div>
        </div>
        <Link
          to="/equipment/new"
          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
        >
          + New Request
        </Link>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage) => (
            <div key={stage.value} className="flex flex-col gap-3">
              <div className="bg-slate-800/50 border border-slate-800 rounded-lg px-4 py-2 sticky top-0 z-10">
                <h3 className="text-sm font-semibold">
                  {stage.label} <span className="text-xs text-slate-400">({grouped[stage.value].length})</span>
                </h3>
              </div>
              <Droppable droppableId={stage.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={[
                      "flex-1 space-y-3 p-2 rounded-lg min-h-[60vh] transition-colors",
                      snapshot.isDraggingOver
                        ? "bg-emerald-500/10 border border-emerald-500/50"
                        : "bg-slate-900/30 border border-slate-800/30",
                    ].join(" ")}
                  >
                    {grouped[stage.value].map((request, index) => (
                      <Draggable key={request.id} draggableId={request.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={[
                              "bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm transition-all",
                              snapshot.isDragging ? "rotate-2 shadow-lg shadow-emerald-500/30" : "",
                              updating === request.id ? "opacity-60" : "",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/requests/${request.id}`}
                                  className="block font-medium truncate hover:text-emerald-400"
                                >
                                  {request.subject}
                                </Link>
                                <div className="text-xs text-slate-400 truncate">
                                  {request.equipment?.equipmentName || "Unknown Equipment"}
                                </div>
                              </div>
                              {request.isOverdue && (
                                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1 text-xs">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800">
                                {request.requestType}
                              </span>
                              {request.maintenanceTeam && (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800">
                                  {request.maintenanceTeam.teamName.slice(0, 10)}
                                </span>
                              )}
                            </div>

                            {request.assignedTechnician && (
                              <div className="mt-2 text-xs text-slate-300">
                                👤 {request.assignedTechnician.fullName || request.assignedTechnician.username}
                              </div>
                            )}

                            {request.scheduledDate && (
                              <div className="mt-2 text-xs text-slate-400">
                                📅 {new Date(request.scheduledDate).toLocaleDateString()}
                              </div>
                            )}

                            {request.isOverdue && (
                              <div className="mt-2 text-xs text-rose-300">
                                ⚠️ Overdue
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {grouped[stage.value].length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        No requests
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default MaintenanceRequests;
