"use client";
import Image from "next/image";
import Link from "next/link";
import { useRecentOrders } from '@/hooks/useVendor';
import { useCurrencyContext } from '@/contexts/CurrencyContext';

const statusColor = {
  delivered: "bg-green-100 text-green-600",
  shipped: "bg-blue-100 text-blue-600", 
  processing: "bg-yellow-100 text-yellow-700",
  pending: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function RecentOrders() {
  const { data: ordersData, isLoading, error } = useRecentOrders(5);
  const { formatPrice } = useCurrencyContext();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatOrderPrice = (price) => {
    return formatPrice(price, 'USD', {
      showSymbol: true,
      decimals: 2
    });
  };

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between mb-6">
          <h2 className="font-semibold">Recent Orders</h2>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-b-[#E5E7EB] pb-3 animate-pulse">
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
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
        <h2 className="font-semibold mb-4">Recent Orders</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Error loading recent orders</p>
        </div>
      </div>
    );
  }

  const orders = ordersData?.data || [];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between mb-6">
        <h2 className="font-semibold">Recent Orders</h2>
        <Link
          href="/orders"
          className="text-sm text-[var(--color-theme)] hover:underline"
        >
          View All Orders
        </Link>
      </div>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recent orders</p>
          </div>
        ) : (
          orders.map((order, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-b-[#E5E7EB] pb-3"
          >
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    statusColor[order.status] || statusColor.pending
                  }`}
                >
                  {capitalizeFirst(order.status)}
                </span>
                <p className="text-sm font-semibold">#{order.order_number}</p>
              </div>

              <div className="flex gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {order.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <p className="text-sm text-gray-500">{order.profiles?.full_name || 'Unknown Customer'}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p>{formatDate(order.created_at)}</p>
              <p className="font-medium">{formatOrderPrice(order.total)}</p>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
