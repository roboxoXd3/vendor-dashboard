'use client'
import { useState, useCallback } from "react";
import FeaturedProductsSection from "./components/FeaturedProductsSection";
import ProductsFilterBar from "./components/ProductsFilterBar";
import ProductPageCards from "./components/ProductsPageCards";

export default function Products() {
  const [filters, setFilters] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleProductUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 space-y-6">
      <ProductsFilterBar onFiltersChange={handleFiltersChange} />
      <ProductPageCards />
      <FeaturedProductsSection 
        filters={filters} 
        refreshKey={refreshKey}
        onProductUpdate={handleProductUpdate}
      />
    </div>
  );
}
