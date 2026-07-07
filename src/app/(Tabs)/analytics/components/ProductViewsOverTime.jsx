"use client";
import { useState } from "react";

// Previously generated entirely fake Math.random() view counts for every day
// in the selected period, presented as if real. Django has no time-bucketed
// analytics endpoint (VendorAnalyticsFunnelView only returns all-time totals,
// no daily/weekly breakdown), so there's no real data source to chart yet —
// showing an honest "not available" state instead of fabricated numbers
// until that backend endpoint exists.
export default function ProductViewsOverTime({ filters = {} }) {
  const [activeView, setActiveView] = useState("daily");

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-md font-semibold">Product Views Over Time</h3>
        <div className="flex gap-2 flex-wrap">
          {["daily", "weekly", "monthly"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 rounded cursor-pointer text-xs ${
                activeView === view
                  ? "text-white bg-[var(--color-theme)]"
                  : "text-gray-500 bg-gray-100"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full flex items-center justify-center text-center text-gray-500 text-sm px-6">
        Views-over-time isn't available yet — the backend doesn't expose a
        day-by-day breakdown of product view events, only all-time totals.
      </div>
    </div>
  );
}
