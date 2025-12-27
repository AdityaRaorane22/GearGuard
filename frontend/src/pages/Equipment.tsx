import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Category, Equipment } from "../types";
import { getEquipments, EquipmentFilters } from "../services/equipmentService";
import { useAuth } from "../context/AuthContext";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:max-w-3xl">
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by equipment name or serial"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory((e.target.value || "") as Category | "")}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-400 mb-1">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Production"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Page size</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {canCreate && (
            <Link
              to="/equipment/new"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
            >
              + Create Equipment
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[40vh] grid place-items-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-400 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="min-h-[40vh] grid place-items-center">
          <div className="text-rose-300 bg-rose-900/30 border border-rose-800 rounded-lg px-4 py-3">{error}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {items.map((eq) => (
              <div
                key={eq.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold truncate">
                      {eq.equipmentName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      SN: {eq.serialNumber}
                    </div>
                  </div>
                  {eq.isScrapped && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-rose-900/30 border border-rose-800 text-rose-300">
                      Scrapped
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-300">
                  <span className="inline-block mr-3">
                    Category: <span className="text-slate-400">{eq.category}</span>
                  </span>
                  {eq.department && (
                    <span className="inline-block">
                      Dept: <span className="text-slate-400">{eq.department}</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {eq.location ? `Location: ${eq.location}` : ""}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Team: {eq.maintenanceTeam?.teamName || "Unassigned"}
                  </span>
                  <span>
                    Requests: {eq.maintenanceRequestsCount ?? 0}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/equipment/${eq.id}`}
                    className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-10">
                No equipment found
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">
              {total ? (
                <span>
                  Showing {(page - 1) * pageSize + 1} -
                  {" "}
                  {Math.min(page * pageSize, total)} of {total}
                </span>
              ) : (
                <span>Page {page} of {totalPages}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md border border-slate-800 bg-slate-900 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EquipmentPage;
