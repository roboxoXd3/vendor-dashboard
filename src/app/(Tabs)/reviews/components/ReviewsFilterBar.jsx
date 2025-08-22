"use client";

import { useState } from "react";
import { FiFilter, FiDownload, FiRefreshCw } from "react-icons/fi";
import { useExportReviews } from "@/hooks/useReviews";

export default function ReviewsFilterBar({ 
  filters, 
  onFilterChange, 
  stats, 
  isLoading,
  onRefresh 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const exportReviews = useExportReviews();

  const handleExport = () => {
    exportReviews.mutate(filters);
  };

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ];

  const statusOptions = [
    { value: 'published', label: 'Published' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'pending_moderation', label: 'Pending Moderation' },
    { value: 'all', label: 'All Status' }
  ];

  const responseOptions = [
    { value: '', label: 'All Reviews' },
    { value: 'true', label: 'With Response' },
    { value: 'false', label: 'Needs Response' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'rating', label: 'Rating' },
    { value: 'helpful_count', label: 'Helpfulness' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Side - Quick Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => onFilterChange({ rating: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ratingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Response Filter */}
          <select
            value={filters.hasResponse}
            onChange={(e) => onFilterChange({ hasResponse: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {responseOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiFilter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => onFilterChange({ 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exportReviews.isLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            {exportReviews.isLoading ? 'Exporting...' : 'Export'}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <FiRefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Minimum Helpful Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Helpful Votes
              </label>
              <input
                type="number"
                min="0"
                value={filters.minHelpfulCount || ''}
                onChange={(e) => onFilterChange({ minHelpfulCount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            {/* Verified Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Verification
              </label>
              <select
                value={filters.verifiedPurchase || ''}
                onChange={(e) => onFilterChange({ verifiedPurchase: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Reviews</option>
                <option value="true">Verified Purchase Only</option>
                <option value="false">Unverified Purchase</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onFilterChange({
                rating: '',
                status: 'published',
                hasResponse: '',
                dateFrom: '',
                dateTo: '',
                minHelpfulCount: '',
                verifiedPurchase: '',
                sortBy: 'created_at',
                sortOrder: 'desc'
              })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {stats && (
              <span>
                Showing reviews • Total: {stats.total} • 
                Needs Response: {stats.needingResponse} • 
                Avg Rating: {stats.averageRating}/5.0
              </span>
            )}
          </div>
          
          {/* Active Filters */}
          <div className="flex items-center gap-2">
            {filters.rating && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {filters.rating} Stars
              </span>
            )}
            {filters.hasResponse === 'false' && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                Needs Response
              </span>
            )}
            {filters.hasResponse === 'true' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                Has Response
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
