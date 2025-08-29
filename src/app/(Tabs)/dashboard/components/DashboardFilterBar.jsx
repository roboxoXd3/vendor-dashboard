"use client";

import { useState } from "react";
import { FaDownload, FaCalendarAlt } from "react-icons/fa";

export default function DashboardFilterBar() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedView, setSelectedView] = useState('daily');

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const views = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    // Here you could trigger a data refresh with the new period
  };

  const handleViewChange = (e) => {
    setSelectedView(e.target.value);
    // Here you could trigger a view change
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range Selector */}
        <div className="relative">
          <select 
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="border border-gray-300 bg-white px-3 py-2 pl-10 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-auto cursor-pointer appearance-none min-w-[180px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>

        {/* View Type Selector */}
        <div className="relative">
          <select 
            value={selectedView}
            onChange={handleViewChange}
            className="border border-gray-300 bg-white px-3 py-2 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-auto cursor-pointer appearance-none min-w-[120px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            {views.map((view) => (
              <option key={view.value} value={view.value}>
                {view.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow cursor-pointer w-full md:w-auto hover:opacity-90"
        style={{ backgroundColor: "var(--color-theme)" }}
        onClick={() => {
          // Handle export functionality
          console.log('Exporting report for period:', selectedPeriod, 'view:', selectedView);
        }}
      >
        <FaDownload className="h-4 w-4" />
        Export Report
      </button>
    </div>
  );
}
