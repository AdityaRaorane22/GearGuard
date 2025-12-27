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
import { useAuth } from "../context/AuthContext";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ArrowRight,
  Calendar
} from "lucide-react";

type StatsResponse = {
  requests_by_stage: Record<string, number>;
  requests_by_team: Record<string, number>;
  overdue_requests: number;
  equipment_by_category: Record<string, number>;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md text-center shadow-sm">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-rose-500" />
          <p className="text-slate-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ label, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
          <Icon size={20} className={color} />
        </div>
        {subtext && <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{subtext}</span>}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{value}</div>
        <div className="text-sm text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm">Welcome back, {user?.fullName?.split(' ')[0] || 'User'}. Here's your overview.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium shadow-sm">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          label="Total Equipment" 
          value={totals.totalEquipment} 
          icon={Wrench} 
          color="text-blue-600"
          subtext="Assets"
        />
        <StatCard 
          label="New Requests" 
          value={totals.newCount} 
          icon={Activity} 
          color="text-emerald-600"
          subtext="Action"
        />
        <StatCard 
          label="In Progress" 
          value={totals.inProgress} 
          icon={Clock} 
          color="text-amber-500"
          subtext="Active"
        />
        <StatCard 
          label="Overdue" 
          value={totals.overdue} 
          icon={AlertTriangle} 
          color="text-rose-600"
          subtext="Critical"
        />
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 xl:col-span-2 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Workload Distribution</h3>
              <p className="text-xs text-slate-500 mt-1">Maintenance requests by team</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="team" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#2563eb" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
            <Link to="/requests" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar">
            {recent.map((r) => (
              <div key={r.id} className="group p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    r.stage === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    r.stage === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    r.stage === 'repaired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {r.stage.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-900 mb-1 truncate group-hover:text-blue-600 transition-colors">{r.subject}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{r.requestType}</span>
                  <Link
                    to={`/requests/${r.id}`}
                    className="text-[10px] text-slate-400 hover:text-blue-600 font-medium transition-colors"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <CheckCircle2 size={24} className="opacity-20" />
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
