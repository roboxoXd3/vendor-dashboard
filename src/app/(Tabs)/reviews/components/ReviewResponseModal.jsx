"use client";

import { useState } from "react";
import { FiX, FiStar, FiUser, FiShield } from "react-icons/fi";
import { useRespondToReview } from "@/hooks/useReviews";

export default function ReviewResponseModal({ review, onClose, onSuccess }) {
  const [response, setResponse] = useState(review.vendor_response || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const respondToReview = useRespondToReview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!response.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await respondToReview.mutateAsync({
        reviewId: review.id,
        vendorResponse: response.trim()
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {review.vendor_response ? 'Edit Response' : 'Respond to Review'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Review Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {/* Customer Info */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {review.profiles?.full_name || 'Anonymous Customer'}
                  </h4>
                  {review.verified_purchase && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <FiShield className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {renderStars(review.rating)}
                  <span className="text-xs text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Product:</span> {review.products?.name}
            </div>

            {/* Review Title */}
            {review.title && (
              <h5 className="text-sm font-medium text-gray-900 mb-2">
                {review.title}
              </h5>
            )}

            {/* Review Content */}
            <p className="text-sm text-gray-700 leading-relaxed">
              {review.content}
            </p>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                📷 {review.images.length} image{review.images.length > 1 ? 's' : ''} attached
              </div>
            )}
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                id="response"
                rows={6}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Thank you for your review! We appreciate your feedback..."
                required
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Be professional, helpful, and address the customer's concerns.
                </p>
                <span className="text-xs text-gray-500">
                  {response.length}/1000
                </span>
              </div>
            </div>

            {/* Response Guidelines */}
            <div className="mb-6 p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Response Guidelines:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Thank the customer for their feedback</li>
                <li>• Address specific concerns mentioned in the review</li>
                <li>• Offer solutions or next steps if applicable</li>
                <li>• Keep it professional and courteous</li>
                <li>• Avoid defensive language</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!response.trim() || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? 'Submitting...' 
                  : review.vendor_response 
                    ? 'Update Response' 
                    : 'Submit Response'
                }
              </button>
            </div>
          </form>

          {/* Existing Response */}
          {review.vendor_response && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Current Response:
              </h4>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {review.vendor_response}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Responded on {formatDate(review.vendor_response_date)}
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
