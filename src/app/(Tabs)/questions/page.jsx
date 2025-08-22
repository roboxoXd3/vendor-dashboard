"use client";

import { useState } from "react";
import { useVendorQA, useQAStats } from "@/hooks/useQA";
import { useAuth } from "@/contexts/AuthContext";
import QAPageCards from "./components/QAPageCards";
import QAFilterBar from "./components/QAFilterBar";
import QATable from "./components/QATable";
import AnswerQuestionModal from "./components/AnswerQuestionModal";
import { FiHelpCircle, FiMessageCircle } from "react-icons/fi";

export default function QuestionsPage() {
  const { vendor } = useAuth();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'pending',
    hasAnswer: '',
    productId: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // Fetch Q&A data
  const {
    data: qaData,
    isLoading: qaLoading,
    error: qaError,
    refetch: refetchQA
  } = useVendorQA(filters);

  // Fetch Q&A statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQAStats();

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

  const handleAnswerQuestion = (question) => {
    setSelectedQuestion(question);
    setShowAnswerModal(true);
  };

  const handleAnswerSuccess = () => {
    setShowAnswerModal(false);
    setSelectedQuestion(null);
    refetchQA();
  };

  if (qaError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Failed to load questions
          </div>
          <div className="text-gray-600 mb-4">
            {qaError.message}
          </div>
          <button
            onClick={() => refetchQA()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions & Answers</h1>
          <p className="text-gray-600 mt-1">
            Manage customer questions about your products
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleFilterChange({ hasAnswer: filters.hasAnswer === 'false' ? '' : 'false' })}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
              filters.hasAnswer === 'false'
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiHelpCircle className="w-4 h-4 mr-2" />
            Needs Answer
            {stats && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {stats.needingAnswer}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <QAPageCards 
        stats={stats} 
        isLoading={statsLoading} 
      />

      {/* Filters */}
      <QAFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        stats={stats}
        isLoading={qaLoading}
      />

      {/* Q&A Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <QATable
          questions={qaData?.questions || []}
          pagination={qaData?.pagination}
          isLoading={qaLoading}
          onPageChange={handlePageChange}
          onAnswerQuestion={handleAnswerQuestion}
          onRefresh={refetchQA}
        />
      </div>

      {/* Answer Modal */}
      {showAnswerModal && selectedQuestion && (
        <AnswerQuestionModal
          question={selectedQuestion}
          onClose={() => setShowAnswerModal(false)}
          onSuccess={handleAnswerSuccess}
        />
      )}
    </div>
  );
}
