"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const noLayoutRoutes = ["/", "/vendor-pending", "/test-connection", "/reset-password"];
  const productFormRoutes = ["/products/create"];

  const isPlainPage = noLayoutRoutes.includes(pathname) || 
                     productFormRoutes.includes(pathname) ||
                     pathname.startsWith("/products/edit/");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isPlainPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar onClose={() => setSidebarOpen(false)} isOpen={sidebarOpen} />

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-opacity-40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className={`flex-1 flex flex-col `}>
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
