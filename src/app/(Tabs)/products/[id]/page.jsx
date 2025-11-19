"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorReviews } from "@/hooks/useReviews";
import { useVendorQA } from "@/hooks/useQA";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { 
  FiArrowLeft, 
  FiEdit, 
  FiStar, 
  FiMessageSquare, 
  FiHelpCircle,
  FiEye,
  FiPackage,
  FiDollarSign,
  FiBarChart,
  FiTag,
  FiLayers,
  FiBox,
  FiInfo,
  FiShield,
  FiTruck,
  FiVideo,
  FiImage as FiImageIcon
} from "react-icons/fi";
import { FaTimesCircle, FaCheckCircle, FaClock } from "react-icons/fa";
import Image from "next/image";
import ReviewsTable from "../../reviews/components/ReviewsTable";
import QATable from "../../questions/components/QATable";
import ReviewResponseModal from "../../reviews/components/ReviewResponseModal";
import AnswerQuestionModal from "../../questions/components/AnswerQuestionModal";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const { vendor } = useAuth();
  const { formatPrice, formatProductPrice } = useCurrencyContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [productId, setProductId] = useState(null);

  // Fetch product reviews
  const {
    data: reviewsData,
    refetch: refetchReviews
  } = useVendorReviews({
    productId: productId,
    limit: 10
  });

  // Fetch product Q&A
  const {
    data: qaData,
    refetch: refetchQA
  } = useVendorQA({
    productId: productId,
    limit: 10
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setProductId(id);
        
        if (id && vendor?.id) {
          await fetchProduct(id);
        }
      } catch (error) {
        console.error('Error loading params:', error);
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [params, vendor?.id]);

  const fetchProduct = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}?vendorId=${vendor.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      const result = await response.json();
      if (result.success) {
        setProduct(result.data);
      } else {
        throw new Error(result.error || 'Product not found');
      }
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

  // Get product images
  const getProductImages = () => {
    if (!product?.images) return [];
    
    try {
      if (Array.isArray(product.images)) {
        return product.images.filter(img => img && typeof img === 'string');
      }
      
      if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) {
            return parsed.filter(img => img && typeof img === 'string');
          }
          if (parsed && typeof parsed === 'object' && parsed.main && Array.isArray(parsed.main)) {
            return parsed.main.filter(img => img && typeof img === 'string');
          }
        } catch {
          // If JSON parsing fails, treat as comma-separated string
          return product.images.split(',').map(url => url.trim()).filter(url => url);
        }
      }
    } catch (error) {
      console.warn('Error processing product images:', error);
    }
    
    return [];
  };

  const productImages = getProductImages();
  const mainImage = productImages[selectedImageIndex] || productImages[0] || '/placeholder.jpg';

  // Get colors array
  const getColors = () => {
    if (!product?.colors) return [];
    
    if (typeof product.colors === 'object' && !Array.isArray(product.colors)) {
      return Object.keys(product.colors);
    }
    
    if (Array.isArray(product.colors)) {
      return product.colors;
    }
    
    return [];
  };

  // Get sizes array
  const getSizes = () => {
    if (!product?.sizes) return [];
    
    if (Array.isArray(product.sizes)) {
      return product.sizes;
    }
    
    if (typeof product.sizes === 'string') {
      return product.sizes.split('|').map(s => s.trim()).filter(s => s);
    }
    
    return [];
  };

  // Get tags array
  const getTags = () => {
    if (!product?.tags) return [];
    
    if (Array.isArray(product.tags)) {
      return product.tags;
    }
    
    if (typeof product.tags === 'string') {
      return product.tags.split('|').map(t => t.trim()).filter(t => t);
    }
    
    return [];
  };

  // Get array fields (box_contents, usage_instructions, etc.)
  const getArrayField = (field) => {
    if (!product?.[field]) return [];
    
    if (Array.isArray(product[field])) {
      return product[field];
    }
    
    if (typeof product[field] === 'string') {
      return product[field].split('|').map(item => item.trim()).filter(item => item);
    }
    
    return [];
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
      icon: FiBarChart,
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

  const colors = getColors();
  const sizes = getSizes();
  const tags = getTags();
  const boxContents = getArrayField('box_contents');
  const usageInstructions = getArrayField('usage_instructions');
  const careInstructions = getArrayField('care_instructions');
  const safetyNotes = getArrayField('safety_notes');

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
                {product.subtitle && (
                  <p className="text-gray-600 text-sm mt-1">{product.subtitle}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">SKU: {product.sku || 'N/A'}</p>
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

      {/* Approval Status Banner */}
      {product?.approval_status && (
        <div className={`border-b ${
          product.approval_status === 'rejected' 
            ? 'bg-red-50 border-red-200' 
            : product.approval_status === 'pending'
            ? 'bg-yellow-50 border-yellow-200'
            : product.approval_status === 'approved'
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-3">
              {product.approval_status === 'rejected' && (
                <FaTimesCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              {product.approval_status === 'pending' && (
                <FaClock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              )}
              {product.approval_status === 'approved' && (
                <FaCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                {product.approval_status === 'rejected' && (
                  <>
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Product Rejected</h3>
                    {product.rejection_reason ? (
                      <p className="text-sm text-red-700 leading-relaxed">
                        <span className="font-medium">Rejection Reason:</span> {product.rejection_reason}
                      </p>
                    ) : (
                      <p className="text-sm text-red-700">This product has been rejected by the admin. Please review and update the product details before resubmitting.</p>
                    )}
                  </>
                )}
                {product.approval_status === 'pending' && (
                  <>
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">Pending Approval</h3>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                      This product is awaiting admin approval. You will be notified once it's reviewed.
                    </p>
                  </>
                )}
                {product.approval_status === 'approved' && (
                  <>
                    <h3 className="text-sm font-semibold text-green-800 mb-1">Product Approved</h3>
                    <p className="text-sm text-green-700 leading-relaxed">
                      This product has been approved by the admin and is now live.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <div className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
                {mainImage && mainImage !== '/placeholder.jpg' ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <FiImageIcon className="w-16 h-16 mb-2" />
                    <span className="text-sm">No Image</span>
                  </div>
                )}
              </div>
              
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.slice(0, 8).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square relative rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {product.video_url && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                  <FiVideo className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700">Product Video Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-1">
                      {(() => {
                        const formattedPrices = formatProductPrice(product);
                        return (
                          <>
                            {formattedPrices.price}
                            {formattedPrices.mrp && formattedPrices.mrp !== formattedPrices.price && (
                              <span className="text-sm text-gray-500 line-through ml-2 font-normal">
                                {formattedPrices.mrp}
                              </span>
                            )}
                            {product.discount_percentage && (
                              <span className="text-sm text-green-600 ml-2">
                                ({product.discount_percentage}% off)
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock Quantity</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {product.stock_quantity || 0} units
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.in_stock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {product.category?.name || product.category_name || 'N/A'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Brand</dt>
                    <dd className="text-sm text-gray-900 mt-1">{product.brand || 'N/A'}</dd>
                  </div>

                  {product.product_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Product Type</dt>
                      <dd className="text-sm text-gray-900 mt-1">{product.product_type}</dd>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rating</dt>
                    <dd className="flex items-center mt-1">
                      <FiStar className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                      <span className="text-sm text-gray-900">
                        {product.rating || 0}/5 ({product.reviews || 0} reviews)
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Orders</dt>
                    <dd className="text-sm text-gray-900 mt-1">{product.orders_count || 0} orders</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status || 'active'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approval Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.approval_status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : product.approval_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.approval_status || 'pending'}
                      </span>
                    </dd>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.is_featured && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        Featured
                      </span>
                    )}
                    {product.is_new_arrival && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        New Arrival
                      </span>
                    )}
                    {product.is_on_sale && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        On Sale
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sizes & Colors */}
          {(sizes.length > 0 || colors.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiLayers className="w-5 h-5" />
                Variants
              </h3>
              
              {sizes.length > 0 && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Available Sizes</dt>
                  <dd className="flex flex-wrap gap-2">
                    {sizes.map((size, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                        {size}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {colors.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Available Colors</dt>
                  <dd className="flex flex-wrap gap-2">
                    {colors.map((color, index) => {
                      const colorData = typeof product.colors === 'object' && !Array.isArray(product.colors) 
                        ? product.colors[color] 
                        : null;
                      const hexColor = colorData?.hex || '#808080';
                      
                      return (
                        <span 
                          key={index} 
                          className="px-3 py-1 rounded-md text-sm flex items-center gap-2 border border-gray-200"
                          style={{ backgroundColor: `${hexColor}20` }}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: hexColor }}
                          />
                          {color}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              )}
            </div>
          )}

          {/* Physical Attributes */}
          {(product.weight || product.dimensions) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5" />
                Physical Attributes
              </h3>
              
              <dl className="space-y-3">
                {product.weight && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Weight</dt>
                    <dd className="text-sm text-gray-900 mt-1">{product.weight} kg</dd>
                  </div>
                )}
                
                {product.dimensions && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {product.dimensions.length && `${product.dimensions.length}cm`} × 
                      {product.dimensions.width && ` ${product.dimensions.width}cm`} × 
                      {product.dimensions.height && ` ${product.dimensions.height}cm`}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Shipping Required</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {product.shipping_required !== false ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiTag className="w-5 h-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Box Contents */}
          {boxContents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiBox className="w-5 h-5" />
                What's in the Box
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {boxContents.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Instructions & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {usageInstructions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiInfo className="w-5 h-5" />
                Usage Instructions
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {usageInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}

          {careInstructions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiInfo className="w-5 h-5" />
                Care Instructions
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {careInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}

          {safetyNotes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FiShield className="w-5 h-5" />
                Safety Notes
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {safetyNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* SEO Information */}
        {(product.meta_title || product.meta_description) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Information</h3>
            <div className="space-y-3">
              {product.meta_title && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Meta Title</dt>
                  <dd className="text-sm text-gray-900 mt-1">{product.meta_title}</dd>
                </div>
              )}
              {product.meta_description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Meta Description</dt>
                  <dd className="text-sm text-gray-700 mt-1">{product.meta_description}</dd>
                </div>
              )}
            </div>
          </div>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Additional Information</h4>
                    <dl className="space-y-2 text-sm">
                      {product.currency && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Currency:</dt>
                          <dd className="text-gray-900">{product.currency}</dd>
                        </div>
                      )}
                      {product.base_currency && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Base Currency:</dt>
                          <dd className="text-gray-900">{product.base_currency}</dd>
                        </div>
                      )}
                      {product.sizing_required !== undefined && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Sizing Required:</dt>
                          <dd className="text-gray-900">{product.sizing_required ? 'Yes' : 'No'}</dd>
                        </div>
                      )}
                      {product.size_chart_override && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Size Chart Override:</dt>
                          <dd className="text-gray-900">{product.size_chart_override}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Timestamps</h4>
                    <dl className="space-y-2 text-sm">
                      {product.created_at && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Created:</dt>
                          <dd className="text-gray-900">
                            {new Date(product.created_at).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {product.updated_at && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Last Updated:</dt>
                          <dd className="text-gray-900">
                            {new Date(product.updated_at).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {product.added_date && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Added Date:</dt>
                          <dd className="text-gray-900">
                            {new Date(product.added_date).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
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
