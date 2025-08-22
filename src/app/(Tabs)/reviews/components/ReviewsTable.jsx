"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  FiStar, 
  FiMessageSquare, 
  FiEye, 
  FiEyeOff, 
  FiMoreVertical,
  FiUser,
  FiCalendar,
  FiShield,
  FiImage
} from "react-icons/fi";
import { useUpdateReviewVisibility } from "@/hooks/useReviews";

export default function ReviewsTable({ 
  reviews, 
  pagination, 
  isLoading, 
  onPageChange, 
  onRespondToReview,
  onRefresh 
}) {
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [expandedReview, setExpandedReview] = useState(null);
  const updateVisibility = useUpdateReviewVisibility();

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedReviews(reviews.map(review => review.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleSelectReview = (reviewId, checked) => {
    if (checked) {
      setSelectedReviews(prev => [...prev, reviewId]);
    } else {
      setSelectedReviews(prev => prev.filter(id => id !== reviewId));
    }
  };

  const handleToggleVisibility = async (review) => {
    const action = review.status === 'published' ? 'hide' : 'show';
    try {
      await updateVisibility.mutateAsync({ reviewId: review.id, action });
      onRefresh();
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-12 text-center">
        <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
        <p className="text-gray-600">
          No reviews match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedReviews.length === reviews.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              {selectedReviews.length > 0 
                ? `${selectedReviews.length} selected`
                : `${reviews.length} reviews`
              }
            </span>
          </div>

          {selectedReviews.length > 0 && (
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                Bulk Respond
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Hide Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {reviews.map((review) => (
          <div key={review.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedReviews.includes(review.id)}
                onChange={(e) => handleSelectReview(review.id, e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              {/* Customer Avatar */}
              <div className="flex-shrink-0">
                {review.profiles?.image_path ? (
                  <Image
                    src={review.profiles.image_path}
                    alt={review.profiles.full_name || 'Customer'}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.profiles?.full_name || 'Anonymous Customer'}
                    </h4>
                    {review.verified_purchase && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <FiShield className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      review.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : review.status === 'hidden'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {review.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <span>Product: </span>
                  <span className="font-medium ml-1">{review.products?.name}</span>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    {review.title}
                  </h5>
                )}

                {/* Review Content */}
                <div className="text-sm text-gray-700 mb-3">
                  <p className={expandedReview === review.id ? '' : 'line-clamp-3'}>
                    {review.content}
                  </p>
                  {review.content.length > 200 && (
                    <button
                      onClick={() => setExpandedReview(
                        expandedReview === review.id ? null : review.id
                      )}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                    >
                      {expandedReview === review.id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <FiImage className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {review.images.length} image{review.images.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Vendor Response */}
                {review.vendor_response ? (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Your Response
                      </span>
                      <span className="text-xs text-blue-700">
                        {formatDate(review.vendor_response_date)}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {review.vendor_response}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <p className="text-sm text-orange-800 mb-2">
                      This review hasn't been responded to yet.
                    </p>
                    <button
                      onClick={() => onRespondToReview(review)}
                      className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                    >
                      Respond to Review
                    </button>
                  </div>
                )}

                {/* Review Stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{review.helpful_count || 0} found helpful</span>
                    {review.reported_count > 0 && (
                      <span className="text-red-600">
                        {review.reported_count} reports
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleVisibility(review)}
                      disabled={updateVisibility.isLoading}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      title={review.status === 'published' ? 'Hide review' : 'Show review'}
                    >
                      {review.status === 'published' ? <FiEyeOff /> : <FiEye />}
                    </button>
                    
                    <button
                      onClick={() => onRespondToReview(review)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      title="Respond to review"
                    >
                      <FiMessageSquare />
                    </button>

                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                      <FiMoreVertical />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                const pageNum = Math.max(1, pagination.page - 2) + index;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      pageNum === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
