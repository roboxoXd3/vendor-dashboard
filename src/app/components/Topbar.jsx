"use client";
import { FiMenu, FiSearch } from "react-icons/fi";
import { FaBell } from "react-icons/fa";
import { usePathname } from "next/navigation";

export default function Topbar({ onToggleSidebar }) {
  const pathname = usePathname().split("/");
  let heading;

  if (pathname.includes("dashboard")) heading = "Vendor Dashboard";
  else if (pathname.includes("orders")) heading = "Orders";
  else if (pathname.includes("products")) heading = "Product Management";
  else if (pathname.includes("payouts")) heading = "Payouts";
  else if (pathname.includes("analytics")) heading = "Product Analytics";
  else if (pathname.includes("support")) heading = "Support & Help Center";
  else if (pathname.includes("settings")) heading = "Store Settings";

  const notificationCount = 3;

  return (
    <div className="flex justify-between items-center px-4 py-4 shadow-sm bg-white sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-2xl text-gray-700 focus:outline-none"
        >
          <FiMenu />
        </button>

        <h1 className="text-lg md:text-xl font-semibold whitespace-nowrap">
          {heading}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-3xl text-md">
          <FiSearch className="text-gray-600" />
          <input
            type="text"
            placeholder="Search..."
            className="outline-none bg-transparent"
          />
        </div>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <FaBell className="text-gray-600 text-2xl cursor-pointer" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {notificationCount}
            </span>
          )}
        </div>

        {/* Avatar */}
        <img
          src="/avatar.png"
          alt="avatar"
          className="w-8 h-8 rounded-full border-2 cursor-pointer"
          style={{ borderColor: "var(--color-theme)" }}
        />
      </div>
    </div>
  );
}
