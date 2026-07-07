"use client";

import { useMemo, useState } from "react";
import { FaDownload } from "react-icons/fa";

// The date dropdown previously listed hardcoded "May/June/July 2023" options
// regardless of the actual current date, and Export Statement always wrote
// "May 1, 2023 – May 31, 2023" into the downloaded CSV. Replaced with real,
// dynamically computed periods. Note: this filter still doesn't drive the
// transaction/escrow lists below it (they're separate components with their
// own data) — wiring real filtering is a separate follow-up.
function buildPeriods() {
  const now = new Date();
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const periods = [];
  for (let i = 0; i < 3; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    periods.push({
      value: `${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`,
      label: `${fmt(start)} – ${fmt(end)}`,
    });
  }
  return periods;
}

export default function PayoutsFilterBar() {
  const periods = useMemo(buildPeriods, []);
  const [selected, setSelected] = useState(periods[0]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <select
        className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 w-full sm:w-auto cursor-pointer"
        value={selected.value}
        onChange={(e) => setSelected(periods.find((p) => p.value === e.target.value) || periods[0])}
      >
        {periods.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <button
        className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow cursor-pointer w-full sm:w-auto min-w-[150px]"
        style={{ backgroundColor: "var(--color-theme)" }}
        onClick={() => {
          const reportData = {
            reportType: 'Payouts Statement',
            generatedAt: new Date().toISOString(),
            dateRange: selected.label,
          };

          const csvHeaders = ['Metric', 'Value', 'Date Range', 'Generated At'];
          const csvRows = [
            ['Report Type', reportData.reportType, reportData.dateRange, reportData.generatedAt],
            ['Date Range', reportData.dateRange, '', ''],
            ['Generated Date', new Date().toLocaleDateString(), '', '']
          ];

          const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
          ].join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `payouts-statement-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }}
      >
        <FaDownload className="h-4 w-4" />
        Export Statement
      </button>
    </div>
  );
}
