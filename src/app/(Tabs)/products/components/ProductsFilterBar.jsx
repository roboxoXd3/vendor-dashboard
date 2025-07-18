"use client";

import { FaDownload } from "react-icons/fa";

export default function ProductsFilterBar() {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
      {/* Left Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <button
          className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow w-full sm:w-auto cursor-pointer"
          style={{ backgroundColor: "var(--color-theme)" }}
        >
          + Add New Product
        </button>

        <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md transition text-sm shadow w-full sm:w-auto cursor-pointer">
          <FaDownload className="h-4 w-4" />
          Import Products
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none w-full sm:w-auto cursor-pointer">
          <option value="filter">Filter</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none w-full sm:w-auto cursor-pointer">
          <option value="all-categories">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="apparel">Apparel</option>
        </select>

        <select className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none w-full sm:w-auto cursor-pointer">
          <option value="newest">Sort By: Newest</option>
          <option value="oldest">Sort By: Oldest</option>
        </select>
      </div>
    </div>
  );
}
