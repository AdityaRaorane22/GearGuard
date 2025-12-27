import React, { useEffect, useState } from "react";
import { MaintenanceTeam, User } from "../types";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Users, Plus, X, Shield, Wrench } from "lucide-react";

const Teams: React.FC = () => {
  const { user } = useAuth();

  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedTeam, setSelectedTeam] = useState<MaintenanceTeam | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [addingMember, setAddingMember] = useState(false);

  // Check authorization
  const canManage = user && (user.role === "admin" || user.role === "manager");
  if (!canManage) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="bg-white border border-rose-200 text-rose-600 flex items-center gap-3 p-4 rounded-lg shadow-sm">
          <Shield size={24} />
          <span>You do not have permission to manage teams.</span>
        </div>
      </div>
    );
  }

  // Load teams
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<MaintenanceTeam[]>("/api/teams");
        if (!mounted) return;
        setTeams(res.data || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || "Failed to load teams");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load available users when member dialog opens
  useEffect(() => {
    if (!memberDialogOpen || !selectedTeam) return;
    let mounted = true;
    async function loadUsers() {
      try {
        const res = await api.get<User[]>("/api/users");
        if (!mounted) return;
        const currentMemberIds = selectedTeam?.members?.map((m) => m.id) || [];
        const available = (res.data || []).filter(
          (u) => !currentMemberIds.includes(u.id)
        );
        setAvailableUsers(available);
      } catch (e: any) {
        // ignore
      }
    }
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [memberDialogOpen, selectedTeam]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) {
      setCreateError("Team name is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.post<MaintenanceTeam>("/api/teams", {
        team_name: teamName.trim(),
        specialization: specialization.trim() || null,
      });
      setTeams([...teams, res.data]);
      setCreateOpen(false);
      setTeamName("");
      setSpecialization("");
    } catch (err: any) {
      setCreateError(err?.response?.data?.detail || "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember() {
    if (!selectedTeam || !selectedUserId) return;
    setAddingMember(true);
    try {
      const res = await api.post<MaintenanceTeam>(
        `/api/teams/${selectedTeam.id}/members`,
        { user_id: selectedUserId }
      );
      setSelectedTeam(res.data);
      setTeams(teams.map((t) => (t.id === res.data.id ? res.data : t)));
      setSelectedUserId("");
    } catch (err: any) {
      console.error(err?.response?.data?.detail || "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedTeam) return;
    try {
      const res = await api.delete<MaintenanceTeam>(
        `/api/teams/${selectedTeam.id}/members/${userId}`
      );
      setSelectedTeam(res.data);
      setTeams(teams.map((t) => (t.id === res.data.id ? res.data : t)));
    } catch (err: any) {
      console.error(err?.response?.data?.detail || "Failed to remove member");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 animate-pulse">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="bg-white border border-rose-200 text-rose-600 flex items-center gap-3 p-4 rounded-lg shadow-sm">
          <Shield size={24} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Teams</h1>
          <p className="text-slate-500 text-sm">Manage technicians and specializations</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={18} />
          <span>Create Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            onClick={() => {
              setSelectedTeam(team);
              setMemberDialogOpen(true);
            }}
            className="glass-card group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users size={80} className="text-slate-900" />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {team.teamName}
                  </h3>
                  {team.specialization && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                      <Wrench size={12} />
                      <span className="truncate">{team.specialization}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <Users size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {team.members?.length || 0}
                  </span>
                </div>
              </div>

              {team.members && team.members.length > 0 ? (
                <div className="flex items-center -space-x-2 overflow-hidden py-2">
                  {team.members.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-xs font-bold text-blue-600 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all shadow-sm"
                      title={member.fullName || member.username}
                    >
                      {(member.fullName || member.username)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  ))}
                  {team.members.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-sm text-slate-400 italic">No members assigned</div>
              )}
              
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>Manage Members</span>
                <Plus size={12} />
              </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Users size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No teams found</h3>
            <p className="text-slate-500 mt-1">Create a team to get started.</p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Create Maintenance Team</DialogTitle>
            <DialogDescription className="text-slate-500">Add a new team to handle specific equipment types.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Team Name<span className="text-rose-500">*</span>
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mechanical Team"
                className="glass-input w-full"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Specialization</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. CNC Machines"
                className="glass-input w-full"
              />
            </div>
            {createError && (
              <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <Shield size={14} />
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
                disabled={!teamName.trim() || creating}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Team"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member Management Modal */}
      {selectedTeam && (
        <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
          <DialogContent className="max-w-2xl bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                {selectedTeam.teamName}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Manage team members and assignments
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Add Member */}
              {availableUsers.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="glass-input flex-1 appearance-none cursor-pointer"
                  >
                    <option value="">Select user to add...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || addingMember}
                    className="btn-primary disabled:opacity-50 whitespace-nowrap"
                  >
                    {addingMember ? "Adding..." : "Add Member"}
                  </button>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  Team Members <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{selectedTeam.members?.length || 0}</span>
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl group hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm">
                            {(member.fullName || member.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {member.fullName || member.username}
                            </div>
                            <div className="text-xs text-slate-500 capitalize flex items-center gap-1">
                              <Shield size={10} />
                              {member.role}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove member"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                      <Users className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-sm text-slate-500">No members assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setMemberDialogOpen(false)}
                className="btn-secondary w-full sm:w-auto"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Teams;
