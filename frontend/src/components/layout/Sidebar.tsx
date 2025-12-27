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
} from "lucide-react";

const navItemBase =
  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors";
const navItemInactive = "text-slate-300 hover:bg-slate-800/70";
const navItemActive = "bg-emerald-500/15 text-emerald-300";

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const isManagerOrAdmin = user?.role === "admin" || user?.role === "manager";

  const LinkItem = (
    props: React.PropsWithChildren<{ to: string; icon: React.ReactNode }>
  ) => {
    const { to, icon, children } = props;
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          [navItemBase, isActive ? navItemActive : navItemInactive].join(" ")
        }
        onClick={() => setOpen(false)}
      >
        <span className="h-5 w-5 text-emerald-400">{icon}</span>
        <span className="truncate">{children}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-emerald-500 text-slate-950 font-bold flex items-center justify-center">
            GG
          </div>
          <span className="text-white font-semibold">GearGuard</span>
        </div>
        <button
          className="p-2 rounded-md bg-slate-800 border border-slate-700 text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle sidebar"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 transform md:transform-none bg-slate-900 border-r border-slate-800 p-4 md:p-5 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="hidden md:flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
            GG
          </div>
          <div>
            <div className="text-white font-semibold text-lg">GearGuard</div>
            <div className="text-slate-400 text-xs">Maintenance Control</div>
          </div>
        </div>

        <nav className="space-y-1">
          <LinkItem to="/dashboard" icon={<LayoutDashboard size={18} />}>Dashboard</LinkItem>
          <LinkItem to="/equipment" icon={<Wrench size={18} />}>Equipment</LinkItem>
          <LinkItem to="/requests" icon={<ClipboardList size={18} />}>Maintenance Requests</LinkItem>
          {isManagerOrAdmin && (
            <LinkItem to="/teams" icon={<Users size={18} />}>Teams</LinkItem>
          )}
        </nav>
      </aside>

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
