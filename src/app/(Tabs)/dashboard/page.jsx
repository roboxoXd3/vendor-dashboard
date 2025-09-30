"use client";

import { useState } from "react";
import BestSellingProducts from "./components/BestSellingProducts";
import RecentOrders from "./components/RecentOrders";
import CustomerLocations from "./components/CustomerLocations";
import InventoryStatus from "./components/InventoryStatus";
import DashboardPageCards from "./components/DashboardPageCards";
import DashboardFilterBar from "./components/DashboardFilterBar";
import SalesTrendChart from "./components/SalesTrendChart";

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    period: '30d',
    view: 'daily'
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  return (
    <div className="grid gap-6 p-4">
      <DashboardFilterBar 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
      <DashboardPageCards filters={filters} />

      {/* Sales Trend Chart */}
      <SalesTrendChart filters={filters} />

      {/* Best Selling & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestSellingProducts filters={filters} />
        <RecentOrders filters={filters} />
      </div>

      {/* Customer Locations & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerLocations filters={filters} />
        <InventoryStatus filters={filters} />
      </div>
    </div>
  );
}
