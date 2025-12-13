"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUpload, FaDownload } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

export default function ProductsFilterBar({ onFiltersChange }) {
  const router = useRouter();
  const { vendor } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [isExporting, setIsExporting] = useState(false);

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
      if (result.success && result.categories) {
        setCategories(result.categories);
      } else {
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

  // Export products function
  const handleExportProducts = async () => {
    if (!vendor?.id) {
      alert('Please log in to export products');
      return;
    }

    setIsExporting(true);
    try {
      // Build query parameters with current filters and high limit to get all products
      const params = new URLSearchParams({
        vendorId: vendor.id,
        page: '1',
        limit: '10000', // High limit to get all products
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/products?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch products');
      }

      const products = result.data || [];

      if (products.length === 0) {
        alert('No products found to export');
        setIsExporting(false);
        return;
      }

      // Convert to CSV
      const csvHeaders = [
        'Product ID',
        'Name',
        'SKU',
        'Category',
        'Status',
        'Price',
        'Stock Quantity',
        'In Stock',
        'Created Date',
        'Last Updated'
      ];

      const csvRows = products.map(product => {
        const categoryName = product.categories?.name || 'N/A';
        const createdDate = product.created_at 
          ? new Date(product.created_at).toLocaleDateString()
          : 'N/A';
        const updatedDate = product.updated_at 
          ? new Date(product.updated_at).toLocaleDateString()
          : 'N/A';
        
        return [
          product.id || '',
          (product.name || '').replace(/"/g, '""'), // Escape quotes
          product.sku || '',
          categoryName.replace(/"/g, '""'),
          product.status || '',
          product.price || '0',
          product.stock_quantity || '0',
          product.in_stock ? 'Yes' : 'No',
          createdDate,
          updatedDate
        ];
      });

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting products:', error);
      alert(`Failed to export products: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={() => router.push('/products/create')}
          className="flex items-center justify-center gap-2 text-white px-5 py-1 rounded-lg transition-all text-sm font-medium shadow-md w-full sm:w-auto cursor-pointer hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
          style={{ backgroundColor: "var(--color-theme)" }}
        >
          <span className="text-lg font-bold">+</span>
          Add New Product
        </button>

        <button 
          onClick={() => router.push('/products/bulk-upload')}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-1 rounded-lg transition-all text-sm font-medium shadow-md w-full sm:w-auto cursor-pointer hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
        >
          <FaUpload className="h-4 w-4" />
          Bulk Upload
        </button>

        <button 
          onClick={handleExportProducts}
          disabled={isExporting}
          className={`flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-1 rounded-lg transition-all text-sm font-medium shadow-md w-full sm:w-auto cursor-pointer hover:bg-green-700 hover:shadow-lg active:scale-[0.98] ${
            isExporting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <FaDownload className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Products'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, category, subtitle, or SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-gray-300 bg-white px-4 py-2.5 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select 
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-auto cursor-pointer transition-all"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>

        <select 
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-auto cursor-pointer transition-all"
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
          className="border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-auto cursor-pointer transition-all"
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
