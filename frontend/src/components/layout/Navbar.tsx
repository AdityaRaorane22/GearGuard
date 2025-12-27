import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bell, Search, ChevronDown, LogOut, User } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      window.location.href = "/login";
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "GG";

  return (
    <nav className="w-full h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200">
      {/* Search Bar */}
      <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-96 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search equipment, requests..."
          className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-50 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-slate-700 leading-tight">{user?.fullName || "User"}</div>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 origin-top-right">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">Signed in as</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>
                
                <div className="p-1 space-y-0.5">
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-2">
                    <User size={14} />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
