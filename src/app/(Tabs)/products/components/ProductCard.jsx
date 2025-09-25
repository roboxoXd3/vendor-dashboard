import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaChartBar, FaTrash, FaStar, FaVideo, FaImage } from "react-icons/fa";
import { useDeleteProduct } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import Tag from "./Tag";

export default function ProductCard({ product, onUpdate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const { vendor } = useAuth();
  const deleteProductMutation = useDeleteProduct();
  const { formatProductPrice } = useCurrencyContext();
  
  // Get formatted prices in global currency
  const formattedPrices = formatProductPrice(product);
  const getTagColor = (tag) => {
    switch (tag) {
      case "Featured":
        return "bg-green-600";
      case "In Stock":
        return "bg-emerald-500";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // Generate tags based on product data
  const generateTags = () => {
    const tags = [];
    if (product.is_featured) tags.push("Featured");
    if (product.stock_quantity > 0) {
      tags.push("In Stock");
    } else {
      tags.push("Out of Stock");
    }
    if (product.is_new_arrival) tags.push("New");
    return tags;
  };

  const tags = generateTags();
  
  // Handle image - use first image from array or default
  const getProductImage = () => {
    // If we've already had an error, use default immediately
    if (imageError) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }


    
    // Try to get the first valid image
    if (product.images) {
      try {
        // Handle array format
        if (Array.isArray(product.images) && product.images.length > 0) {
          const firstImage = product.images[0];
          const imageUrl = typeof firstImage === 'string' ? firstImage : 'https://via.placeholder.com/300x200?text=No+Image';
          return imageUrl;
        }
        
        // Handle JSON string format
        if (typeof product.images === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(product.images);
            

            
            if (Array.isArray(parsed) && parsed.length > 0) {
              const firstImage = parsed[0];
              const imageUrl = typeof firstImage === 'string' ? firstImage : 'https://via.placeholder.com/300x200?text=No+Image';
              return imageUrl;
            } else if (parsed && typeof parsed === 'object' && parsed.main && Array.isArray(parsed.main) && parsed.main.length > 0) {
              const firstImage = parsed.main[0];
              const imageUrl = typeof firstImage === 'string' ? firstImage : 'https://via.placeholder.com/300x200?text=No+Image';
              return imageUrl;
            }
          } catch (parseError) {
            // If JSON parsing fails, treat as comma-separated string
            const firstImage = product.images.split(',')[0]?.trim();
            return firstImage || 'https://via.placeholder.com/300x200?text=No+Image';
          }
        }
        
        // Handle direct string
        if (typeof product.images === 'string' && product.images.trim() !== '') {
          return product.images;
        }
      } catch (error) {
        console.warn('Error processing product image:', error);
      }
    }
    
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  const productImage = getProductImage();

  // Check if product has video
  const hasVideo = product.video_url && product.video_url.trim().length > 0;

  const handleDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync(product.id);
      onUpdate?.();
      setShowDeleteConfirm(false);
    } catch (error) {
      alert('Failed to delete product. Please try again.');
    }
  };



  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col gap-3">
                <div className="relative">
            {productImage === 'https://via.placeholder.com/300x200?text=No+Image' || imageError ? (
              <div className="w-full h-40 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                <FaImage className="w-8 h-8 mb-2 text-gray-300" />
                <span className="text-sm font-medium">No Image</span>
                <span className="text-xs">Click Images to add</span>
              </div>
            ) : (
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg"
                onError={() => {
                  setImageError(true);
                }}
              />
            )}
            <div className="absolute top-2 right-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag} label={tag} color={getTagColor(tag)} />
              ))}
            </div>
            {hasVideo && (
              <div className="absolute top-2 left-2">
                <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                  <FaVideo size={10} />
                  <span>Video</span>
                </div>
              </div>
            )}
          </div>

      <div className="p-2">
        <div className="flex justify-between">
          <h3 className="font-semibold text-sm text-gray-800">
            {product.name}
          </h3>
          <h3 className="font-semibold text-sm text-[#D97706] flex items-center gap-1">
            <FaStar />
            {product.rating || 0}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-1">{product.description || 'No description available'}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-emerald-600">
              {formattedPrices.price}
            </span>
            {formattedPrices.salePrice && (
              <span className="line-through text-gray-400 text-xs">
                {formattedPrices.salePrice}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Stock:{" "}
            {product.stock_quantity > 0 ? (
              product.stock_quantity
            ) : (
              <span className="text-red-500">0</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 border-t p-2 pt-3">
        <button
          onClick={() => router.push(`/products/edit/${product.id}`)}
          className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer transition-colors"
        >
          <FaEdit className="h-4 w-4" /> Edit
        </button>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1 hover:text-red-500 cursor-pointer transition-colors"
        >
          <FaTrash className="h-4 w-4" /> Delete
        </button>
      </div>



      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Product
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProductMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProductMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
