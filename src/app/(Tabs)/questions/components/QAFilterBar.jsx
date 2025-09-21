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

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'answered', label: 'Answered' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'all', label: 'All Status' }
  ];

  const answerOptions = [
    { value: '', label: 'All Questions' },
    { value: 'true', label: 'With Answer' },
    { value: 'false', label: 'Needs Answer' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'is_helpful_count', label: 'Helpfulness' },
    { value: 'answered_at', label: 'Answer Date' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left Side - Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Answer Filter */}
          <select
            value={filters.hasAnswer}
            onChange={(e) => onFilterChange({ hasAnswer: e.target.value })}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {answerOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiFilter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">More Filters</span>
            <span className="sm:hidden">More</span>
          </button>
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

            <button
              onClick={() => onFilterChange({ 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm hover:bg-gray-50"
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
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
            onClick={onRefresh}
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
            {filters.hasAnswer === 'true' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                Has Answer
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
