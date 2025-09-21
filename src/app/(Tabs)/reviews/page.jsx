"use client";

import { useState } from "react";
import { useVendorReviews, useReviewStats } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsPageCards from "./components/ReviewsPageCards";
import ReviewsFilterBar from "./components/ReviewsFilterBar";
import ReviewsTable from "./components/ReviewsTable";
import ReviewResponseModal from "./components/ReviewResponseModal";
import { FiMessageSquare, FiStar, FiEye, FiEyeOff } from "react-icons/fi";

export default function ReviewsPage() {
  const { vendor } = useAuth();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    rating: '',
    status: 'published',
    hasResponse: '',
    productId: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  const [selectedReview, setSelectedReview] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Fetch reviews data
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews
  } = useVendorReviews(filters);

  // Fetch review statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useReviewStats();

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRespondToReview = (review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  const handleResponseSuccess = () => {
    setShowResponseModal(false);
    setSelectedReview(null);
    refetchReviews();
  };

  if (reviewsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Failed to load reviews
          </div>
          <div className="text-gray-600 mb-4">
            {reviewsError.message}
          </div>
          <button
            onClick={() => refetchReviews()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage customer reviews and feedback for your products
          </p>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => handleFilterChange({ hasResponse: filters.hasResponse === 'false' ? '' : 'false' })}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md text-sm font-medium ${
              filters.hasResponse === 'false'
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiMessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Needs Response</span>
            <span className="sm:hidden">Pending</span>
            {stats && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {stats.needingResponse}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ReviewsPageCards 
        stats={stats} 
        isLoading={statsLoading} 
      />

      {/* Filters */}
      <ReviewsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={stats}
        isLoading={reviewsLoading}
      />

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <ReviewsTable
          reviews={reviewsData?.reviews || []}
          pagination={reviewsData?.pagination}
          isLoading={reviewsLoading}
          onPageChange={handlePageChange}
          onRespondToReview={handleRespondToReview}
          onRefresh={refetchReviews}
        />
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <ReviewResponseModal
          review={selectedReview}
          onClose={() => setShowResponseModal(false)}
          onSuccess={handleResponseSuccess}
        />
      )}
    </div>
  );
}
