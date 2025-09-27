"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  FiHelpCircle, 
  FiMessageCircle, 
  FiEye, 
  FiEyeOff, 
  FiMoreVertical,
  FiUser,
  FiCalendar,
  FiThumbsUp,
  FiCheck
} from "react-icons/fi";
import { useUpdateQuestionVisibility } from "@/hooks/useQA";

export default function QATable({ 
  questions, 
  pagination, 
  isLoading, 
  onPageChange, 
  onAnswerQuestion,
  onRefresh 
}) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const updateVisibility = useUpdateQuestionVisibility();

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (questionId, checked) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleToggleVisibility = async (question) => {
    const action = question.status === 'pending' ? 'hide' : 'show';
    try {
      await updateVisibility.mutateAsync({ questionId: question.id, action });
      onRefresh();
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  const handleApproveQuestion = async (question) => {
    try {
      await updateVisibility.mutateAsync({ questionId: question.id, action: 'approve' });
      onRefresh();
    } catch (error) {
      console.error('Failed to approve question:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 sm:p-12 text-center">
        <FiHelpCircle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No questions found</h3>
        <p className="text-sm sm:text-base text-gray-600">
          No questions match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedQuestions.length === questions.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-700">
              {selectedQuestions.length > 0 
                ? `${selectedQuestions.length} selected`
                : `${questions.length} questions`
              }
            </span>
          </div>

          {selectedQuestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                <span className="hidden sm:inline">Approve Selected</span>
                <span className="sm:hidden">Approve</span>
              </button>
              <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                <span className="hidden sm:inline">Bulk Answer</span>
                <span className="sm:hidden">Answer</span>
              </button>
              <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                <span className="hidden sm:inline">Hide Selected</span>
                <span className="sm:hidden">Hide</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="divide-y divide-gray-200">
        {questions.map((question) => (
          <div key={question.id} className="p-3 sm:p-6 hover:bg-gray-50">
            <div className="flex items-start space-x-3 sm:space-x-4">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedQuestions.includes(question.id)}
                onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              {/* Customer Avatar */}
              <div className="flex-shrink-0">
                {question.profiles?.image_path ? (
                  <Image
                    src={question.profiles.image_path}
                    alt={question.profiles.full_name || 'Customer'}
                    width={40}
                    height={40}
                    className="rounded-full sm:w-12 sm:h-12"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Question Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {question.profiles?.full_name || 'Anonymous Customer'}
                    </h4>
                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                      question.status === 'answered' 
                        ? 'bg-green-100 text-green-800'
                        : question.status === 'pending' && question.vendor_id
                        ? 'bg-blue-100 text-blue-800'
                        : question.status === 'hidden'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {question.status === 'pending' && question.vendor_id ? 'approved' : question.status}
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm text-gray-500">
                    {formatDate(question.created_at)}
                  </span>
                </div>

                {/* Product Info */}
                <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  <span>Product: </span>
                  <span className="font-medium ml-1 truncate">{question.products?.name}</span>
                </div>

                {/* Question */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-start space-x-2">
                    <FiHelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className={`text-xs sm:text-sm text-gray-900 ${expandedQuestion === question.id ? '' : 'line-clamp-2'}`}>
                        {question.question}
                      </p>
                      {question.question.length > 150 && (
                        <button
                          onClick={() => setExpandedQuestion(
                            expandedQuestion === question.id ? null : question.id
                          )}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm mt-1"
                        >
                          {expandedQuestion === question.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answer */}
                {question.answer ? (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-green-900 flex items-center">
                        <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Your Answer
                      </span>
                      <span className="text-xs text-green-700">
                        {formatDate(question.answered_at)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-green-800">
                      {question.answer}
                    </p>
                  </div>
                ) : (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <p className="text-xs sm:text-sm text-orange-800 mb-2">
                      This question hasn't been answered yet.
                    </p>
                    <button
                      onClick={() => onAnswerQuestion(question)}
                      className="text-xs sm:text-sm bg-orange-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-orange-700"
                    >
                      Answer Question
                    </button>
                  </div>
                )}

                {/* Question Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center">
                      <FiThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {question.is_helpful_count || 0} helpful
                    </span>
                    {question.is_verified && (
                      <span className="text-green-600">Verified</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {question.status === 'pending' && !question.vendor_id && (
                      <button
                        onClick={() => handleApproveQuestion(question)}
                        disabled={updateVisibility.isLoading}
                        className="p-1.5 sm:p-2 text-green-500 hover:text-green-700 rounded"
                        title="Approve question"
                      >
                        <FiCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleToggleVisibility(question)}
                      disabled={updateVisibility.isLoading}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded"
                      title={question.status === 'pending' ? 'Hide question' : 'Show question'}
                    >
                      {question.status === 'pending' ? <FiEyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <FiEye className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </button>
                    
                    <button
                      onClick={() => onAnswerQuestion(question)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded"
                      title="Answer question"
                    >
                      <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>

                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded">
                      <FiMoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
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
