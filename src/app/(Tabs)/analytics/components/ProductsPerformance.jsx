"use client";

import { useProductPerformance } from '@/hooks/useVendor';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import Image from 'next/image';

export default function ProductsPerformance({ filters = {} }) {
  const { data: productsData, isLoading, error } = useProductPerformance(filters);
  const { formatPrice } = useCurrencyContext();
  
  // Ensure products is always an array
  const products = Array.isArray(productsData) ? productsData : [];
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-3 md:p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-md font-semibold text-gray-700">
            Product Performance
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-3 md:p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-md font-semibold text-gray-700">
            Product Performance
          </h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading product performance: {error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-3 md:p-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-md font-semibold text-gray-700">
            Product Performance
          </h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No product performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-3 md:p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-md font-semibold text-gray-700">
          Product Performance
        </h2>
        <button 
          className="text-sm cursor-pointer text-[var(--color-theme)] hover:underline"
          onClick={() => {
            // Export products performance data
            const csvHeaders = ['Product', 'Views', 'Conversion Rate', 'Revenue', 'Avg. Rating'];
            const csvRows = products.map(product => [
              product.name,
              product.views,
              product.conversionRate,
              product.revenue,
              product.rating
            ]);
            
            const csvContent = [
              csvHeaders.join(','),
              ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `products-performance-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }}
        >
          Export Data
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="min-w-[700px] w-full text-sm text-left">
          <thead className="text-xs text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-3">Product</th>
              <th>Views</th>
              <th>Conversion Rate</th>
              <th>Revenue</th>
              <th>Avg. Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-4 flex items-center gap-2 min-w-[150px]">
                  <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        width={16} 
                        height={16} 
                        className="w-4 h-4 rounded"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    )}
                  </span>
                  <span className="text-gray-700 font-medium truncate">
                    {product.name}
                  </span>
                </td>
                <td className="py-4 pr-5 font-medium whitespace-nowrap">
                  {product.views.toLocaleString()}
                </td>
                <td className="py-4 text-green-600 whitespace-nowrap">
                  {product.conversionRate}%{" "}
                  <span className="text-xs text-green-500">
                    ↑ {product.delta?.toFixed(1) || 0}%
                  </span>
                </td>
                <td className="py-4 font-semibold whitespace-nowrap">
                  {formatPrice(product.revenue)}
                </td>
                <td className="py-4 flex items-center gap-1 whitespace-nowrap">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>
                      {idx < Math.floor(product.rating) ? (
                        <span className="text-yellow-400">★</span>
                      ) : (
                        <span className="text-gray-300">★</span>
                      )}
                    </span>
                  ))}
                  <span className="ml-1 text-gray-600">
                    {product.rating.toFixed(1)}
                  </span>
                </td>
                <td className="py-4 whitespace-nowrap">
                  <button className="text-sm text-[var(--color-theme)] cursor-pointer">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {products.map((product, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name} 
                    width={20} 
                    height={20} 
                    className="w-5 h-5 rounded"
                  />
                ) : (
                  <div className="w-5 h-5 bg-gray-300 rounded"></div>
                )}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {product.views.toLocaleString()} views
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-700 mb-1">
              <strong>Conversion:</strong> {product.conversionRate}%{" "}
              <span className="text-xs text-green-500">↑ {product.delta?.toFixed(1) || 0}%</span>
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <strong>Revenue:</strong> {formatPrice(product.revenue)}
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-700 mb-1">
              <strong>Rating:</strong>
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx}>
                  {idx < Math.floor(product.rating) ? (
                    <span className="text-yellow-400">★</span>
                  ) : (
                    <span className="text-gray-300">★</span>
                  )}
                </span>
              ))}
              <span className="ml-1 text-gray-600">
                {product.rating.toFixed(1)}
              </span>
            </div>

            <button className="mt-2 text-sm text-[var(--color-theme)] cursor-pointer">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
