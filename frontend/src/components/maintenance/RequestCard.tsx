import React, { useState } from "react";
import { MaintenanceRequest, RequestType } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AlertCircle, Wrench, ClipboardCheck } from "lucide-react";

export interface RequestCardProps {
  request: MaintenanceRequest;
  onClick?: () => void;
  className?: string;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onClick, className }) => {
  const [detailOpen, setDetailOpen] = useState(false);

  const initials = request.assignedTechnician?.fullName
    ? request.assignedTechnician.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : request.assignedTechnician?.username?.slice(0, 2).toUpperCase() || "NA";

  const avatarColor = request.assignedTechnician
    ? `hsl(${request.assignedTechnician.id.charCodeAt(0) * 10 % 360}, 70%, 50%)`
    : "hsl(210, 15%, 50%)";

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setDetailOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={[
          "bg-white rounded-lg p-3 text-sm cursor-pointer transition-all shadow-sm",
          "hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-0.5",
          request.isOverdue ? "border-2 border-rose-400" : "border border-slate-200",
          className || "",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate text-slate-900">{request.subject}</div>
            <div className="text-xs text-slate-500 truncate">
              {request.equipment?.equipmentName || "Unknown Equipment"}
            </div>
          </div>
          {request.isOverdue && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
            title={request.assignedTechnician?.fullName || request.assignedTechnician?.username || "Unassigned"}
          >
            {initials}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs whitespace-nowrap text-slate-600 border border-slate-200">
            {request.requestType === RequestType.CORRECTIVE ? (
              <Wrench className="w-3 h-3" />
            ) : (
              <ClipboardCheck className="w-3 h-3" />
            )}
            {request.requestType === RequestType.CORRECTIVE ? "Corrective" : "Preventive"}
          </span>
        </div>

        {request.requestType === RequestType.PREVENTIVE && request.scheduledDate && (
          <div className="text-xs text-slate-500">
            📅 {new Date(request.scheduledDate).toLocaleDateString()}
          </div>
        )}

        {request.isOverdue && (
          <div className="mt-1 text-xs text-rose-600 font-medium">⚠️ Overdue</div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{request.subject}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {request.equipment?.equipmentName || "Unknown Equipment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Type</div>
                <div className="text-sm font-medium text-slate-900">
                  {request.requestType === RequestType.CORRECTIVE
                    ? "Corrective"
                    : "Preventive"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <div className="text-sm font-medium capitalize text-slate-900">{request.stage}</div>
              </div>
              {request.assignedTechnician && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Assigned Technician</div>
                  <div className="text-sm font-medium text-slate-900">
                    {request.assignedTechnician.fullName || request.assignedTechnician.username}
                  </div>
                </div>
              )}
              {request.maintenanceTeam && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Team</div>
                  <div className="text-sm font-medium text-slate-900">{request.maintenanceTeam.teamName}</div>
                </div>
              )}
              {request.scheduledDate && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Scheduled Date</div>
                  <div className="text-sm font-medium text-slate-900">
                    {new Date(request.scheduledDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {request.durationHours && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Duration</div>
                  <div className="text-sm font-medium text-slate-900">{request.durationHours} hours</div>
                </div>
              )}
              {request.createdAt && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Created</div>
                  <div className="text-sm font-medium text-slate-900">
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {request.description && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Description</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {request.description}
                </div>
              </div>
            )}

            {request.isOverdue && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <div className="text-sm text-rose-600">
                  ⚠️ This request is overdue
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestCard;
