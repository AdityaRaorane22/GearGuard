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
import { Users, Plus, X } from "lucide-react";

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
        <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-4 py-3">
          You do not have permission to manage teams. Only admin and manager can access this page.
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
      // show error
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Maintenance Teams</h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            onClick={() => {
              setSelectedTeam(team);
              setMemberDialogOpen(true);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer transition-all hover:border-emerald-700/40 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{team.teamName}</h3>
                {team.specialization && (
                  <p className="text-sm text-slate-400 truncate">
                    {team.specialization}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-md flex-shrink-0">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">
                  {team.members?.length || 0}
                </span>
              </div>
            </div>
            {team.members && team.members.length > 0 && (
              <div className="flex items-center gap-1">
                {team.members.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900"
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
                {team.members.length > 3 && (
                  <div className="text-xs text-slate-400 ml-1">
                    +{team.members.length - 3}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-400">
              Click to manage members
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">
            No teams created yet
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Maintenance Team</DialogTitle>
            <DialogDescription>Add a new maintenance team</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4 mt-2">
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">
                Team Name<span className="text-rose-400">*</span>
              </label>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mechanical Team"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Specialization</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. CNC Machines"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
                disabled={!teamName.trim() || creating}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member Management Modal */}
      {selectedTeam && (
        <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTeam.teamName}</DialogTitle>
              <DialogDescription>
                Manage team members and specialization
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Add Member */}
              {availableUsers.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <option value="">Select user to add...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.username}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId || addingMember}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-medium"
                  >
                    {addingMember ? "Adding..." : "Add"}
                  </button>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Team Members ({selectedTeam.members?.length || 0})</h3>
                <div className="space-y-2">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {member.fullName || member.username}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {member.role}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No members yet</div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setMemberDialogOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
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
