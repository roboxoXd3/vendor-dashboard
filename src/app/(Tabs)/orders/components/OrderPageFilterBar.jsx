import { FaDownload } from "react-icons/fa";

export default function OrdersPageFilterBar() {
  return (
    <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 mb-2">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 cursor-pointer w-full sm:w-auto">
          <option>May 1, 2023 – May 31, 2023</option>
          <option>June 1, 2023 – June, 2023</option>
        </select>

        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-0 cursor-pointer w-full sm:w-auto">
          <option value="all-products">All Products</option>
          <option value="smartphones">Smartphones</option>
        </select>
      </div>

      {/* Export Button */}
      <button
        className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow cursor-pointer w-full sm:w-auto min-w-[150px]"
        style={{ backgroundColor: "var(--color-theme)" }}
      >
        <FaDownload className="h-4 w-4" />
        Export Statement
      </button>
    </div>
  );
}
