import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:pl-72 min-h-screen flex flex-col transition-all duration-300">
        {/* Navbar */}
        <div className="sticky top-0 z-20 backdrop-blur-sm">
          <Navbar />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
