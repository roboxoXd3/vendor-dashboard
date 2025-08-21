"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUpload } from "react-icons/fa";

export default function ProductsFilterBar({ onFiltersChange }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      console.log('📂 ProductsFilterBar - Categories API response:', result);
      if (result.success && result.categories) {
        console.log('📂 ProductsFilterBar - Setting categories:', result.categories);
        setCategories(result.categories);
      } else {
        console.log('📂 ProductsFilterBar - No categories found in response');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [key]: value };
      return newFilters;
    });
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prevFilters => {
        const newFilters = { ...prevFilters, search: searchInput };
        return newFilters;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Separate effect to notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
      {/* Left Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <button
                onClick={() => router.push('/products/create')}
                className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition text-sm shadow w-full sm:w-auto cursor-pointer hover:opacity-90"
                style={{ backgroundColor: "var(--color-theme)" }}
              >
                + Add New Product
              </button>

        <button 
          onClick={() => router.push('/products/bulk-upload')}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md transition text-sm shadow w-full sm:w-auto cursor-pointer hover:bg-blue-700"
        >
          <FaUpload className="h-4 w-4" />
          Bulk Upload
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
        />

        <select 
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none w-full sm:w-auto cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>

        <select 
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none w-full sm:w-auto cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories && categories.length > 0 ? (
            categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          ) : (
            <option disabled>Loading categories...</option>
          )}
        </select>

        <select 
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            handleFilterChange('sortBy', sortBy);
            handleFilterChange('sortOrder', sortOrder);
          }}
          className="border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:outline-none w-full sm:w-auto cursor-pointer"
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price Low-High</option>
          <option value="price-desc">Price High-Low</option>
        </select>
      </div>


    </div>
  );
}
