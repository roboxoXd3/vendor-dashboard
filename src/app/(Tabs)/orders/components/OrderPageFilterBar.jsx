import { FaDownload, FaSync } from "react-icons/fa";
import { useExportOrders } from "@/hooks/useOrders";

export default function OrdersPageFilterBar({ 
  dateRange = { from: "", to: "" }, 
  onDateRangeChange = () => {}, 
  isLoading = false, 
  onRefresh = () => {} 
}) {
  const exportOrders = useExportOrders();

  const handleDateFromChange = (e) => {
    onDateRangeChange({ ...dateRange, from: e.target.value });
  };

  const handleDateToChange = (e) => {
    onDateRangeChange({ ...dateRange, to: e.target.value });
  };

  const handleExport = () => {
    exportOrders.mutate({
      format: 'csv',
      dateFrom: dateRange.from,
      dateTo: dateRange.to
    });
  };
  return (
    <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 mb-2">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={handleDateFromChange}
            className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 cursor-pointer"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={handleDateToChange}
            className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 cursor-pointer"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <FaSync className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isLoading || exportOrders.isPending}
        className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow cursor-pointer w-full sm:w-auto min-w-[150px] disabled:opacity-50"
        style={{ backgroundColor: "var(--color-theme)" }}
      >
        <FaDownload className="h-4 w-4" />
        {exportOrders.isPending ? 'Exporting...' : 'Export Orders'}
      </button>
    </div>
  );
}
