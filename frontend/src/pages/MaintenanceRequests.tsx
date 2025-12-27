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
import { 
  AlertCircle, 
  Calendar, 
  Filter, 
  Plus, 
  User, 
  Wrench,
  MoreHorizontal
} from "lucide-react";

const STAGES: { value: RequestStage; label: string; color: string }[] = [
  { value: RequestStage.NEW, label: "New", color: "bg-blue-500" },
  { value: RequestStage.IN_PROGRESS, label: "In Progress", color: "bg-amber-500" },
  { value: RequestStage.REPAIRED, label: "Repaired", color: "bg-emerald-500" },
  { value: RequestStage.SCRAP, label: "Scrap", color: "bg-rose-500" },
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
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 animate-pulse">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="bg-white border border-rose-200 text-rose-600 flex items-center gap-3 p-4 rounded-lg shadow-sm">
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header & Filters */}
      <div className="flex flex-col gap-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Maintenance Board</h1>
            <p className="text-slate-500 text-sm">Track and manage maintenance requests</p>
          </div>
          <Link
            to="/requests/new"
            className="btn-primary flex items-center gap-2 self-start md:self-auto"
          >
            <Plus size={18} />
            <span>New Request</span>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mr-2">
            <Filter size={16} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:max-w-2xl">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.teamName}</option>
              ))}
            </select>
            
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="">All Equipment</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>{e.equipmentName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1000px] h-full">
            {STAGES.map((stage) => (
              <div key={stage.value} className="flex-1 flex flex-col min-w-[280px] bg-slate-50 border border-slate-200 rounded-xl border-t-4" style={{ borderTopColor: stage.color.replace('bg-', 'var(--tw-colors-') }}>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-sm rounded-t-xl z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                  </div>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {grouped[stage.value].length}
                  </span>
                </div>
                
                <Droppable droppableId={stage.value}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-colors ${
                        snapshot.isDraggingOver ? "bg-slate-100" : ""
                      }`}
                    >
                      {grouped[stage.value].map((request, index) => (
                        <Draggable key={request.id} draggableId={request.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                bg-white border border-slate-200 rounded-xl p-4 
                                hover:shadow-md transition-all group
                                ${snapshot.isDragging ? "rotate-2 shadow-xl scale-105 z-50 ring-2 ring-blue-500/50" : "shadow-sm"}
                                ${updating === request.id ? "opacity-50" : ""}
                              `}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Link
                                  to={`/requests/${request.id}`}
                                  className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight"
                                >
                                  {request.subject}
                                </Link>
                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                  <MoreHorizontal size={16} />
                                </button>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <Wrench size={12} />
                                <span className="truncate max-w-[150px]">{request.equipment?.equipmentName || "Unknown"}</span>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-600 uppercase tracking-wider">
                                  {request.requestType}
                                </span>
                                {request.isOverdue && (
                                  <span className="px-2 py-1 rounded-md bg-rose-50 border border-rose-100 text-[10px] text-rose-600 uppercase tracking-wider flex items-center gap-1">
                                    <AlertCircle size={10} /> Overdue
                                  </span>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1.5" title="Assigned Technician">
                                  <User size={12} />
                                  <span className="truncate max-w-[100px]">
                                    {request.assignedTechnician?.fullName?.split(' ')[0] || "Unassigned"}
                                  </span>
                                </div>
                                {request.scheduledDate && (
                                  <div className="flex items-center gap-1.5" title="Scheduled Date">
                                    <Calendar size={12} />
                                    <span>{new Date(request.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default MaintenanceRequests;
