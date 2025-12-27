import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Category, Equipment } from "../types";
import { getEquipments, EquipmentFilters } from "../services/equipmentService";
import { useAuth } from "../context/AuthContext";
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Wrench,
  MapPin,
  Users,
  AlertCircle
} from "lucide-react";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "machine", label: "Machine" },
  { value: "vehicle", label: "Vehicle" },
  { value: "computer", label: "Computer" },
  { value: "other", label: "Other" },
];

const PAGE_SIZES = [8, 12, 24, 48];

const EquipmentPage: React.FC = () => {
  const { user } = useAuth();

  const [items, setItems] = useState<Equipment[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [department, setDepartment] = useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Derived
  const totalPages = useMemo(() => {
    if (!total || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // Fetch
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const filters: EquipmentFilters = {
          search: search.trim() || undefined,
          category: (category as Category) || undefined,
          department: department.trim() || undefined,
          page,
          pageSize,
        };
        const { data, total } = await getEquipments(filters);
        if (!mounted) return;
        setItems(data);
        setTotal(total);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.detail || "Failed to load equipment");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    // Debounce for search & department to limit requests
    const t = setTimeout(load, 300);
    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(t);
    };
  }, [search, category, department, page, pageSize]);

  // Reset to page 1 when filters change (except page/pageSize)
  useEffect(() => {
    setPage(1);
  }, [search, category, department]);

  const canCreate = user && (user.role === "admin" || user.role === "manager");

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Equipment Inventory</h1>
            <p className="text-slate-500 text-sm">Manage and track all company assets</p>
          </div>
          {canCreate && (
            <Link
              to="/equipment/new"
              className="btn-primary flex items-center gap-2 self-start md:self-auto"
            >
              <Plus size={18} />
              <span>Add Equipment</span>
            </Link>
          )}
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-end md:items-center justify-between shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:max-w-4xl">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or serial..."
                className="glass-input w-full pl-10"
              />
            </div>
            
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory((e.target.value || "") as Category | "")}
                className="glass-input w-full pl-10 appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Filter by Department"
                className="glass-input w-full pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs text-slate-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-700"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[40vh] grid place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-slate-500 animate-pulse">Loading equipment...</p>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-[40vh] grid place-items-center">
          <div className="bg-white border border-rose-200 text-rose-600 flex items-center gap-3 p-4 rounded-lg shadow-sm">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {items.map((eq) => (
              <div
                key={eq.id}
                className="glass-card group flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wrench size={80} className="text-slate-900" />
                </div>

                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {eq.equipmentName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      SN: {eq.serialNumber}
                    </p>
                  </div>
                  {eq.isScrapped && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
                      Scrapped
                    </span>
                  )}
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Category</span>
                    <span className="text-slate-700 capitalize">{eq.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Department</span>
                    <span className="text-slate-700">{eq.department || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Location</span>
                    <span className="text-slate-700">{eq.location || "-"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={14} />
                    <span>{eq.maintenanceTeam?.teamName || "Unassigned"}</span>
                  </div>
                  <Link
                    to={`/equipment/${eq.id}`}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Wrench size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No equipment found</h3>
                <p className="text-slate-500 mt-1">Try adjusting your filters or add new equipment.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              {total ? (
                <span>
                  Showing <span className="text-slate-900 font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
                  <span className="text-slate-900 font-medium">{Math.min(page * pageSize, total)}</span> of{" "}
                  <span className="text-slate-900 font-medium">{total}</span>
                </span>
              ) : (
                <span>Page {page} of {totalPages}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium px-2 text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EquipmentPage;
