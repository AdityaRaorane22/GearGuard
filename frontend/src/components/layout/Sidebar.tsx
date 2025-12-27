import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Users,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isManagerOrAdmin = user?.role === "admin" || user?.role === "manager";

  const LinkItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
          isActive
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        }`
      }
    >
      <span className={`${!open ? "group-hover:text-current" : ""}`}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                GG
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-none">GearGuard</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Enterprise</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-3">
            <nav className="space-y-1">
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Platform
              </div>
              <LinkItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              <LinkItem to="/equipment" icon={<Wrench size={18} />} label="Equipment" />
              <LinkItem to="/requests" icon={<ClipboardList size={18} />} label="Requests" />
              
              {isManagerOrAdmin && (
                <>
                  <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Management
                  </div>
                  <LinkItem to="/teams" icon={<Users size={18} />} label="Teams" />
                </>
              )}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-medium text-sm shadow-sm">
                {user?.fullName?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.fullName || "User"}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (window.confirm("Logout?")) logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors text-xs font-medium shadow-sm"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
