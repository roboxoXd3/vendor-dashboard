"use client";

import { FaDownload } from "react-icons/fa";

export default function PayoutsFilterBar() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 w-full sm:w-auto cursor-pointer">
        <option value="custom-dates">May 1, 2023 – May 31, 2023</option>
        <option value="custom-dates">June 1, 2023 – June 30, 2023</option>
        <option value="custom-dates">July 1, 2023 – July 31, 2023</option>
      </select>

      <button
        className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow cursor-pointer w-full sm:w-auto min-w-[150px]"
        style={{ backgroundColor: "var(--color-theme)" }}
        onClick={() => {
          // Generate payouts statement
          const reportData = {
            reportType: 'Payouts Statement',
            generatedAt: new Date().toISOString(),
            dateRange: 'May 1, 2023 – May 31, 2023'
          };
          
          // Convert to CSV
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
          
          // Create and download file
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
