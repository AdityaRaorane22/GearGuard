import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Grid shell: sidebar + main */}
      <div className="md:grid md:grid-cols-[18rem_1fr]">
        {/* Sidebar handles its own mobile topbar and collapse */}
        <Sidebar />

        {/* Main column */}
        <div className="min-h-screen flex flex-col">
          {/* Top navbar: hide on small screens to avoid double headers with Sidebar's mobile bar */}
          <div className="hidden md:block sticky top-0 z-20">
            <Navbar />
          </div>

          {/* Content area */}
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
