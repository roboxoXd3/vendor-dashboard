"use client";

import { useState } from "react";
import { FiX, FiHelpCircle, FiUser } from "react-icons/fi";
import { useAnswerQuestion } from "@/hooks/useQA";

export default function AnswerQuestionModal({ question, onClose, onSuccess }) {
  const [answer, setAnswer] = useState(question.answer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answerQuestion = useAnswerQuestion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await answerQuestion.mutateAsync({
        questionId: question.id,
        answer: answer.trim()
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to submit answer:', error);
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
              {question.answer ? 'Edit Answer' : 'Answer Question'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Question Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {/* Customer Info */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {question.profiles?.full_name || 'Anonymous Customer'}
                </h4>
                <div className="text-xs text-gray-500 mt-1">
                  Asked on {formatDate(question.created_at)}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Product:</span> {question.products?.name}
            </div>

            {/* Question */}
            <div className="flex items-start space-x-2">
              <FiHelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {question.question}
                </p>
              </div>
            </div>

            {/* Question Stats */}
            <div className="mt-3 text-sm text-gray-500">
              {question.is_helpful_count > 0 && (
                <span>{question.is_helpful_count} people found this question helpful</span>
              )}
            </div>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                id="answer"
                rows={6}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Provide a helpful and detailed answer to the customer's question..."
                required
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Be clear, helpful, and provide accurate information about your product.
                </p>
                <span className="text-xs text-gray-500">
                  {answer.length}/1000
                </span>
              </div>
            </div>

            {/* Answer Guidelines */}
            <div className="mb-6 p-3 bg-blue-50 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Answer Guidelines:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Provide accurate and helpful information</li>
                <li>• Address the specific question asked</li>
                <li>• Include relevant product details or specifications</li>
                <li>• Be professional and courteous</li>
                <li>• If you don't know, say so and offer to find out</li>
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
                disabled={!answer.trim() || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? 'Submitting...' 
                  : question.answer 
                    ? 'Update Answer' 
                    : 'Submit Answer'
                }
              </button>
            </div>
          </form>

          {/* Existing Answer */}
          {question.answer && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Current Answer:
              </h4>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  {question.answer}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Answered on {formatDate(question.answered_at)}
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
