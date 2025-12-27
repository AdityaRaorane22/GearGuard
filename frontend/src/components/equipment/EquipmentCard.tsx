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
        "group bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2",
        "transition-transform transition-colors hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10",
        className || "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900 truncate">{equipmentName}</div>
          <div className="text-xs text-slate-500 truncate">SN: {serialNumber}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
            {category}
          </span>
          {isScrapped && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600">
              Scrapped
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-600">
        <span className="inline-block mr-3">
          Assigned: <span className="text-slate-500">{assignedEmployee?.fullName || assignedEmployee?.username || "Unassigned"}</span>
        </span>
        {location && (
          <span className="inline-block">
            Location: <span className="text-slate-500">{location}</span>
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
          Team: <span className="text-slate-500">{maintenanceTeam?.teamName || "Unassigned"}</span>
        </span>
        <span className="text-slate-500">{requestsLabel}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`/equipment/${id}`}
          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
          aria-label={`View details for ${equipmentName}`}
        >
          View
        </Link>
        <Link
          to={`/equipment/${id}`}
          className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
          aria-label={`Open requests for ${equipmentName}`}
        >
          {typeof openCount === "number" ? `Open Requests (${openCount})` : `View Requests`}
        </Link>
      </div>
    </div>
  );
};

export default EquipmentCard;
