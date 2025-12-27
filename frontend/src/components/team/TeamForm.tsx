import React, { useEffect, useMemo, useState } from "react";
import { MaintenanceTeam, User } from "../../types";
import api from "../../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Search, X } from "lucide-react";

export type TeamFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initial?: Partial<MaintenanceTeam> & { id?: string };
  onSuccess?: (team: MaintenanceTeam) => void;
};

const TeamForm: React.FC<TeamFormProps> = ({
  open,
  onOpenChange,
  mode = "create",
  initial,
  onSuccess,
}) => {
  const [teamName, setTeamName] = useState(initial?.teamName || "");
  const [specialization, setSpecialization] = useState(initial?.specialization || "");

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>(initial?.members || []);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available users on open
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function loadUsers() {
      try {
        const res = await api.get<User[]>("/api/users");
        if (!mounted) return;
        setAvailableUsers(res.data || []);
      } catch (e: any) {
        // ignore
      }
    }
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [open]);

  // Reset form on close
  useEffect(() => {
    if (open) return;
    setTeamName(initial?.teamName || "");
    setSpecialization(initial?.specialization || "");
    setSelectedMembers(initial?.members || []);
    setUserSearch("");
    setShowUserDropdown(false);
    setError(null);
    setSubmitting(false);
  }, [open]);

  // Filter available users for dropdown
  const unselectedUsers = useMemo(() => {
    const selected = new Set(selectedMembers.map((m) => m.id));
    let filtered = availableUsers.filter((u) => !selected.has(u.id));
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.fullName?.toLowerCase().includes(q) ?? false) ||
          u.username.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [availableUsers, selectedMembers, userSearch]);

  const canSubmit = useMemo(() => {
    return teamName.trim().length >= 2;
  }, [teamName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        team_name: teamName.trim(),
        specialization: specialization.trim() || null,
        member_ids: selectedMembers.map((m) => m.id),
      };

      let result: MaintenanceTeam;
      if (mode === "edit" && initial?.id) {
        const res = await api.patch<MaintenanceTeam>(
          `/api/teams/${initial.id}`,
          payload
        );
        result = res.data;
      } else {
        const res = await api.post<MaintenanceTeam>("/api/teams", payload);
        result = res.data;
      }
      if (onSuccess) onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "create" ? "Create Team" : "Edit Team";
  const description =
    mode === "create"
      ? "Create a new maintenance team"
      : "Update team details and members";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          {/* Team Name */}
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

          {/* Specialization */}
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">Specialization</label>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. CNC Machines, Hydraulics"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Members Selection */}
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-2">Team Members</label>

            {/* Selected Members */}
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/20 border border-emerald-600/50"
                >
                  <span className="text-sm">
                    {member.fullName || member.username}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMembers((prev) =>
                        prev.filter((m) => m.id !== member.id)
                      )
                    }
                    className="hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Members Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Search and add members..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Dropdown */}
              {showUserDropdown && unselectedUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {unselectedUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedMembers([...selectedMembers, user]);
                        setUserSearch("");
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-b-0 transition-colors"
                    >
                      <div className="text-sm font-medium">
                        {user.fullName || user.username}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {user.role}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Click outside to close dropdown */}
              {showUserDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserDropdown(false)}
                />
              )}
            </div>

            {selectedMembers.length === 0 && (
              <div className="mt-2 text-xs text-slate-400">
                No members selected. You can add them later.
              </div>
            )}
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
              {submitting ? "Saving..." : mode === "create" ? "Create Team" : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamForm;
