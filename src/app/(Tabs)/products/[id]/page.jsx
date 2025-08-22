"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorReviews } from "@/hooks/useReviews";
import { useVendorQA } from "@/hooks/useQA";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  FiArrowLeft, 
  FiEdit, 
  FiStar, 
  FiMessageSquare, 
  FiHelpCircle,
  FiEye,
  FiPackage,
  FiDollarSign,
  FiBarChart3
} from "react-icons/fi";
import Image from "next/image";
import ReviewsTable from "../../../reviews/components/ReviewsTable";
import QATable from "../../../questions/components/QATable";
import ReviewResponseModal from "../../../reviews/components/ReviewResponseModal";
import AnswerQuestionModal from "../../../questions/components/AnswerQuestionModal";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const { vendor } = useAuth();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // Fetch product reviews
  const {
    data: reviewsData,
    refetch: refetchReviews
  } = useVendorReviews({
    productId: params.id,
    limit: 10
  });

  // Fetch product Q&A
  const {
    data: qaData,
    refetch: refetchQA
  } = useVendorQA({
    productId: params.id,
    limit: 10
  });

  useEffect(() => {
    if (params.id && vendor?.id) {
      fetchProduct();
    }
  }, [params.id, vendor?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${params.id}?vendorId=${vendor.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      setProduct(data.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToReview = (review) => {
    setSelectedReview(review);
    setShowResponseModal(true);
  };

  const handleAnswerQuestion = (question) => {
    setSelectedQuestion(question);
    setShowAnswerModal(true);
  };

  const handleResponseSuccess = () => {
    setShowResponseModal(false);
    setSelectedReview(null);
    refetchReviews();
  };

  const handleAnswerSuccess = () => {
    setShowAnswerModal(false);
    setSelectedQuestion(null);
    refetchQA();
  };

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: FiPackage,
      count: null
    },
    {
      id: 'reviews',
      name: 'Reviews',
      icon: FiStar,
      count: reviewsData?.stats?.total || 0
    },
    {
      id: 'questions',
      name: 'Q&A',
      icon: FiHelpCircle,
      count: qaData?.stats?.total || 0
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: FiBarChart3,
      count: null
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-medium mb-2">
            Product not found
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-gray-600">SKU: {product.sku}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/products/edit/${product.id}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiEdit className="w-4 h-4 mr-2" />
                Edit Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Product Image */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="aspect-square relative mb-4">
                <Image
                  src={product.images || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {/* Additional images would go here */}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Price</dt>
                      <dd className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price, product.currency || 'USD')}
                        {product.mrp && product.mrp !== product.price && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            {formatPrice(product.mrp, product.currency || 'USD')}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Stock</dt>
                      <dd className="text-sm text-gray-900">{product.stock_quantity || 0} units</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="text-sm text-gray-900">{product.category?.name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Brand</dt>
                      <dd className="text-sm text-gray-900">{product.brand || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rating</dt>
                      <dd className="flex items-center">
                        <FiStar className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {product.rating || 0}/5 ({product.reviews || 0} reviews)
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Orders</dt>
                      <dd className="text-sm text-gray-900">{product.orders_count || 0} orders</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                    {tab.count !== null && (
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Overview</h3>
                <p className="text-gray-600">
                  Additional product information and specifications would go here.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Average: {reviewsData?.stats?.averageRating || 0}/5</span>
                    <span>Total: {reviewsData?.stats?.total || 0}</span>
                    <span>Needs Response: {reviewsData?.stats?.needingResponse || 0}</span>
                  </div>
                </div>
                
                <ReviewsTable
                  reviews={reviewsData?.reviews || []}
                  pagination={reviewsData?.pagination}
                  isLoading={false}
                  onPageChange={() => {}}
                  onRespondToReview={handleRespondToReview}
                  onRefresh={refetchReviews}
                />
              </div>
            )}

            {activeTab === 'questions' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Customer Questions</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Total: {qaData?.stats?.total || 0}</span>
                    <span>Needs Answer: {qaData?.stats?.needingAnswer || 0}</span>
                    <span>Answer Rate: {qaData?.stats?.answerRate || 0}%</span>
                  </div>
                </div>
                
                <QATable
                  questions={qaData?.questions || []}
                  pagination={qaData?.pagination}
                  isLoading={false}
                  onPageChange={() => {}}
                  onAnswerQuestion={handleAnswerQuestion}
                  onRefresh={refetchQA}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Analytics</h3>
                <p className="text-gray-600">
                  Product performance analytics and insights would go here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showResponseModal && selectedReview && (
        <ReviewResponseModal
          review={selectedReview}
          onClose={() => setShowResponseModal(false)}
          onSuccess={handleResponseSuccess}
        />
      )}

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
