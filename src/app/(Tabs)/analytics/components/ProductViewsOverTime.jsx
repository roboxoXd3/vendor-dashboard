"use client";
import { useState } from "react";

export default function ProductViewsOverTime() {
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
              className={`px-3 py-1 rounded cursor-pointer ${
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

      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        Showing: <strong className="ml-1 capitalize">{activeView}</strong> data
      </div>
    </div>
  );
}
