"use client";

import { FiTablet, FiHeadphones, FiBox } from "react-icons/fi";
import { useBestSellingProducts } from '@/hooks/useVendor';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import Image from 'next/image';

export default function BestSellingProducts() {
  const { data: productsData, isLoading, error } = useBestSellingProducts(3);
  const { formatPrice } = useCurrencyContext();

  const formatProductPrice = (price) => {
    return formatPrice(price, 'USD', {
      showSymbol: true,
      decimals: 2
    });
  };

  const getProductIcon = (productName) => {
    const name = productName?.toLowerCase() || '';
    if (name.includes('earbuds') || name.includes('headphones') || name.includes('audio')) {
      return <FiHeadphones />;
    } else if (name.includes('tablet') || name.includes('ipad') || name.includes('screen')) {
      return <FiTablet />;
    } else {
      return <FiBox />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Best Selling Products</h2>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-8 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-15 h-15 bg-gray-200 rounded-md"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Best Selling Products</h2>
          <a
            href="/products"
            className="text-sm text-[var(--color-theme)] hover:underline"
          >
            View All Products
          </a>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Error loading products</p>
        </div>
      </div>
    );
  }

  const products = productsData?.data || [];
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold">Best Selling Products</h2>
        <a
          href="/products"
          className="text-sm text-[var(--color-theme)] hover:underline"
        >
          View All Products
        </a>
      </div>
      <div className="space-y-8 p-4">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No products found</p>
          </div>
        ) : (
          products.map((product, i) => (
            <div key={product.id || i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-15 h-15 bg-gray-100 rounded-md flex items-center justify-center text-xl text-gray-500">
                  {getProductIcon(product.name)}
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatProductPrice(product.price)}</p>
                <p className="text-sm" style={{ color: "var(--color-theme)" }}>
                  {product.orders_count || 0} sold
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
