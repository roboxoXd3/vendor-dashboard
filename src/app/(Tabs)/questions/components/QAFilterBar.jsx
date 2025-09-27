"use client";

import { useState } from "react";
import { FiFilter, FiDownload, FiRefreshCw } from "react-icons/fi";
import { useExportQA } from "@/hooks/useQA";

export default function QAFilterBar({ 
  filters, 
  onFilterChange, 
  stats, 
  isLoading,
  onRefresh 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const exportQA = useExportQA();

  const handleExport = () => {
    exportQA.mutate(filters);
  };

  const filterOptions = [
    { value: 'all', label: 'All Questions' },
    { value: 'pending', label: 'Pending' },
    { value: 'answered', label: 'Answered' },
    { value: 'hidden', label: 'Hidden' },
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'is_helpful_count', label: 'Helpfulness' },
    { value: 'answered_at', label: 'Answer Date' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left Side - Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Combined Filter */}
          <select
            value={filters.hasAnswer === 'false' ? 'needs_answer' : filters.status}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'needs_answer') {
                onFilterChange({ 
                  status: 'all',
                  hasAnswer: 'false'
                });
              } else {
                onFilterChange({ 
                  status: value,
                  hasAnswer: ''
                });
              }
            }}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sort */}
          <div className="flex items-center gap-1 sm:gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value })}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>


          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exportQA.isLoading}
            className="flex items-center px-2 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
          >
            <FiDownload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{exportQA.isLoading ? 'Exporting...' : 'Export'}</span>
            <span className="sm:hidden">{exportQA.isLoading ? '...' : 'Export'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => window.location.reload()}
            disabled={isLoading}
            className="flex items-center px-2 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
          >
            <FiRefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600">
          <div>
            {stats && (
              <span>
                <span className="hidden sm:inline">Showing questions • </span>
                Total: {stats.total} • 
                <span className="hidden sm:inline"> Needs Answer: {stats.needingAnswer} • </span>
                <span className="sm:hidden"> Pending: {stats.needingAnswer} • </span>
                Rate: {stats.answerRate}%
              </span>
            )}
          </div>
          
          {/* Active Filters */}
          <div className="flex items-center gap-2">
            {filters.hasAnswer === 'false' && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                Needs Answer
              </span>
            )}
            {filters.status !== 'all' && filters.hasAnswer !== 'false' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {filterOptions.find(opt => opt.value === filters.status)?.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
