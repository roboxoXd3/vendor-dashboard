"use client";

import { FaDownload } from "react-icons/fa";

export default function DashboardFilterBar() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 w-full md:w-auto cursor-pointer">
          <option value="may">May 1, 2023 – May 31, 2023</option>
          <option value="june">June 1, 2023 – June 30, 2023</option>
          <option value="july">July 1, 2023 – July 31, 2023</option>
        </select>

        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 w-full md:w-auto cursor-pointer">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <button
        className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow cursor-pointer w-full md:w-auto"
        style={{ backgroundColor: "var(--color-theme)" }}
      >
        <FaDownload className="h-4 w-4" />
        Export Report
      </button>
    </div>
  );
}
