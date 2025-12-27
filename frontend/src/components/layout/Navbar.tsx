import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    const ok = window.confirm("Are you sure you want to logout?");
    if (ok) {
      logout();
      window.location.href = "/login";
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "GG";

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
          GG
        </div>
        <div>
          <div className="text-white font-semibold text-lg">GearGuard</div>
          <div className="text-slate-400 text-xs">Maintenance Control</div>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 transition rounded-lg px-3 py-2 border border-slate-700"
        >
          <div className="text-right hidden sm:block">
            <div className="text-white text-sm font-semibold">{user?.fullName || user?.username || "User"}</div>
            <div className="text-slate-400 text-xs">{user?.role}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-600 text-slate-950 font-bold flex items-center justify-center">
            {initials}
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20">
            <div className="px-4 py-3 border-b border-slate-800">
              <div className="text-white text-sm font-semibold">{user?.fullName || user?.username}</div>
              <div className="text-slate-400 text-xs truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-rose-300 hover:bg-rose-500/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
