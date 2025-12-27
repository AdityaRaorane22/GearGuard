import React from "react";
import { Link } from "react-router-dom";
import { Equipment } from "../../types";

export interface EquipmentCardProps {
  equipment: Equipment;
  openCount?: number; // if provided, shows open requests; falls back to total requests count
  className?: string;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, openCount, className }) => {
  const {
    id,
    equipmentName,
    serialNumber,
    category,
    assignedEmployee,
    location,
    maintenanceTeam,
    isScrapped,
    maintenanceRequestsCount,
  } = equipment;

  const requestsLabel = typeof openCount === "number" ? `Open: ${openCount}` : `Requests: ${maintenanceRequestsCount ?? 0}`;

  return (
    <div
      className={[
        "group bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2",
        "transition-transform transition-colors hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-lg hover:shadow-emerald-500/10",
        className || "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{equipmentName}</div>
          <div className="text-xs text-slate-400 truncate">SN: {serialNumber}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {category}
          </span>
          {isScrapped && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-rose-900/30 border border-rose-800 text-rose-300">
              Scrapped
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-300">
        <span className="inline-block mr-3">
          Assigned: <span className="text-slate-400">{assignedEmployee?.fullName || assignedEmployee?.username || "Unassigned"}</span>
        </span>
        {location && (
          <span className="inline-block">
            Location: <span className="text-slate-400">{location}</span>
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
          Team: <span className="text-slate-400">{maintenanceTeam?.teamName || "Unassigned"}</span>
        </span>
        <span className="text-slate-400">{requestsLabel}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`/equipment/${id}`}
          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm"
          aria-label={`View details for ${equipmentName}`}
        >
          View
        </Link>
        <Link
          to={`/equipment/${id}`}
          className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm"
          aria-label={`Open requests for ${equipmentName}`}
        >
          {typeof openCount === "number" ? `Open Requests (${openCount})` : `View Requests`}
        </Link>
      </div>
    </div>
  );
};

export default EquipmentCard;
