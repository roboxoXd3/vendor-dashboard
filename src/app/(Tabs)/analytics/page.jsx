"use client";

import { useState } from "react";
import AnalyticsFilterBar from "./components/AnalyticsFilterBar";
import AnalyticsPageCards from "./components/AnalyticsPageCards";
import ProductViewsOverTime from "./components/ProductViewsOverTime";
import ConversionRateByProduct from "./components/ConversinRateByProduct";
import ProductsPerformance from "./components/ProductsPerformance";

export default function AnalyticsPage() {
  const [filters, setFilters] = useState({
    period: '30d',
    view: 'daily'
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  return (
    <div className="p-4 grid gap-6 max-w-screen-xl mx-auto">
      <AnalyticsFilterBar 
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
      <AnalyticsPageCards filters={filters} />

      {/* Responsive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="lg:col-span-1">
          <ProductViewsOverTime filters={filters} />
        </div>
        <div className="lg:col-span-1">
          <ConversionRateByProduct filters={filters} />
        </div>
      </div>

      <ProductsPerformance filters={filters} />
    </div>
  );
}
