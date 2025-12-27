import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { MaintenanceRequest } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";

type StatsResponse = {
  requests_by_stage: Record<string, number>;
  requests_by_team: Record<string, number>; // teamId or "none" -> count
  overdue_requests: number;
  equipment_by_category: Record<string, number>;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, reqRes] = await Promise.all([
          api.get<StatsResponse>("/api/dashboard/stats"),
          api.get<MaintenanceRequest[]>("/api/requests"),
        ]);
        if (!mounted) return;
        setStats(statsRes.data);
        const sorted = [...reqRes.data].sort((a, b) => {
          const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bd - ad;
        });
        setRecent(sorted.slice(0, 5));
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const totalEquipment = stats
      ? Object.values(stats.equipment_by_category || {}).reduce((sum, n) => sum + n, 0)
      : 0;
    const newCount = stats?.requests_by_stage?.["new"] || 0;
    const inProgress = stats?.requests_by_stage?.["in_progress"] || 0;
    const overdue = stats?.overdue_requests || 0;
    return { totalEquipment, newCount, inProgress, overdue };
  }, [stats]);

  const teamChartData = useMemo(() => {
    if (!stats) return [] as { team: string; count: number }[];
    return Object.entries(stats.requests_by_team).map(([teamId, count]) => ({
      team: teamId === "none" ? "Unassigned" : teamId.slice(0, 8),
      count,
    }));
  }, [stats]);

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
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-sm">Total Equipment</div>
          <div className="text-3xl font-bold mt-1">{totals.totalEquipment}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-sm">New Requests</div>
          <div className="text-3xl font-bold mt-1">{totals.newCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-sm">In Progress</div>
          <div className="text-3xl font-bold mt-1">{totals.inProgress}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-sm">Overdue</div>
          <div className="text-3xl font-bold mt-1 text-rose-300">{totals.overdue}</div>
        </div>
      </div>

      {/* Chart and Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Requests by Team</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="team" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", color: "#e2e8f0" }} />
                <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent Requests</h3>
            <Link to="/requests" className="text-emerald-400 text-sm hover:text-emerald-300">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-800">
            {recent.map((r) => (
              <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.subject}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {r.requestType} • {r.stage} • {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : "No schedule"}
                  </div>
                </div>
                <Link
                  to={`/requests/${r.id}`}
                  className="text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700"
                >
                  Open
                </Link>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="py-6 text-center text-slate-400 text-sm">No recent requests</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
