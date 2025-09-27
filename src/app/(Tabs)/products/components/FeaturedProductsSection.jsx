"use client";
import React, { useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useVendorProducts } from '@/hooks/useProducts';
import ProductCard from "./ProductCard";

export default function FeaturedProductsSection({ filters = {}, refreshKey = 0, onProductUpdate }) {
  const PRODUCTS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const { vendor } = useAuth();

  const { data: productsData, isLoading, error, refetch } = useVendorProducts({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    ...filters
  });

  // Refetch when refreshKey changes
  React.useEffect(() => {
    if (refreshKey > 0) {
      refetch();
    }
  }, [refreshKey, refetch]);

  // Reset to page 1 when filters change (but not on initial load)
  const [previousFilters, setPreviousFilters] = React.useState(filters);
  React.useEffect(() => {
    // Only reset if filters actually changed (deep comparison for key filter properties)
    const filtersChanged = 
      previousFilters.search !== filters.search ||
      previousFilters.category !== filters.category ||
      previousFilters.status !== filters.status ||
      previousFilters.sortBy !== filters.sortBy ||
      previousFilters.sortOrder !== filters.sortOrder;
    
    if (filtersChanged) {
      setCurrentPage(1);
      setPreviousFilters(filters);
    }
  }, [filters, previousFilters]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
            <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
            <div className="p-2 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading products: {error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const products = productsData?.data || [];
  const totalPages = productsData?.pagination?.totalPages || 1;

  const handlePageClick = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div>
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-lg mb-4">No products found</p>
          <p className="text-gray-500 text-sm">Start by adding your first product to the store</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onUpdate={() => {
                  refetch();
                  onProductUpdate?.();
                }}
              />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 text-sm rounded-md border border-gray-300 w-fit mx-auto bg-white p-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            &lt;
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handlePageClick(num)}
              className={`px-4 py-2 cursor-pointer ${
                currentPage === num
                  ? "bg-emerald-600 text-white"
                  : "hover:bg-gray-200 text-gray-700"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 cursor-pointer ${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-gray-200 text-gray-700"
            }`}
          >
            &gt;
          </button>
        </div>
      )}
      
    </div>
  );
}
