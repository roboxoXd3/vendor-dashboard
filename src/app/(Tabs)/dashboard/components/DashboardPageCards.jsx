"use client";
import { FaDollarSign, FaShoppingCart, FaTag, FaBox, FaUsers } from "react-icons/fa";
import { useDashboardStats } from '@/hooks/useVendor';
import { useCurrencyContext } from '@/contexts/CurrencyContext';

export default function DashboardPageCards({ filters = {} }) {
  const { data: statsData, isLoading, error } = useDashboardStats(filters);
  const { formatPrice, globalCurrency, getCurrencySymbol } = useCurrencyContext();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white shadow-sm rounded-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error loading dashboard stats</p>
      </div>
    )
  }

  const stats = statsData?.data;
  const resolvedCurrency = stats?.currency || globalCurrency || "USD";
  const formattedRevenue = formatPrice(stats?.totalSales || 0, resolvedCurrency, {
    showSymbol: true,
    decimals: 2
  });

  const items = [
    {
      title: "Total Revenue",
      value: formattedRevenue,
      icon: <FaDollarSign size={20} color="green" />,
      color: "bg-green-200",
      description: "Revenue from completed & delivered orders"
    },
    {
      title: "Total Orders",
      value: (stats?.totalOrders || 0).toLocaleString(),
      icon: <FaShoppingCart size={20} color="blue" />,
      color: "bg-blue-200",
      description: "Unique orders in the selected period"
    },
    {
      title: "Total Products",
      value: (stats?.totalProducts || 0).toLocaleString(),
      icon: <FaBox size={20} color="purple" />,
      color: "bg-purple-200",
      description: "Active products currently in your catalog"
    },
    {
      title: "Followers",
      value: (stats?.followerCount || 0).toLocaleString(),
      icon: <FaUsers size={20} color="indigo" />,
      color: "bg-indigo-200",
      description: "People following your store"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg p-6 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500">
                {item.title}
              </h3>
              <div className={`p-2 rounded-full ${item.color} text-white`}>
                {item.icon}
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              <p className="font-bold text-lg">{item.value}</p>
              {item.description && (
                <p className="text-xs text-gray-500">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
