'use client'
import { MdCheckCircle, MdError, MdInventory2 } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductPageCards() {
  const { vendor } = useAuth();

  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['product-stats', vendor?.id],
    queryFn: async () => {
      const response = await fetch(`/api/vendor-stats?vendorId=${vendor?.id}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!vendor?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white shadow-sm rounded-lg p-5 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Error loading product stats</p>
      </div>
    );
  }

  const stats = statsData?.data || {};
  const outOfStockPercentage = stats.totalProducts > 0 ? ((stats.outOfStock / stats.totalProducts) * 100).toFixed(1) : 0;
  const featuredPercentage = stats.totalProducts > 0 ? ((stats.featuredProducts / stats.totalProducts) * 100).toFixed(1) : 0;

  const items = [
    {
      title: "Total Products",
      value: stats.totalProducts?.toString() || "0",
      icon: <MdInventory2 size={20} color="blue" />,
      color: "bg-blue-200",
      label: "Products in your store",
    },
    {
      title: "Active Products",
      value: stats.activeProducts?.toString() || "0",
      icon: <MdCheckCircle size={20} color="green" />,
      color: "bg-green-200",
      label: "Currently available",
    },
    {
      title: "Out Of Stock",
      value: stats.outOfStock?.toString() || "0",
      icon: <MdError size={20} color="red" />,
      color: "bg-red-200",
      label: "Need restocking",
    },
    {
      title: "Featured Products",
      value: stats.featuredProducts?.toString() || "0",
      icon: <FaStar size={20} color="brown" />,
      color: "bg-yellow-200",
      label: "Promoted products",
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-between h-full"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-500">
              {item.title}
            </h3>
            <div
              className={`p-3 rounded-full ${item.color} text-white text-xl`}
            >
              {item.icon}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-3 relative max-w-fit">
              <p className="font-bold text-lg md:text-[30px]">{item.value}</p>
            </div>
            <p className="text-sm text-gray-500 text-[12px]">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
