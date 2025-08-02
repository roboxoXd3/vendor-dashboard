'use client'
import { FaDollarSign, FaShoppingCart, FaTag, FaBox } from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";
import { useDashboardStats } from '@/hooks/useVendor';

export default function DashboardPageCards() {
  const { data: statsData, isLoading, error } = useDashboardStats();

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
  const avgOrderValue = stats?.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0;

  const items = [
    {
      title: "Total Revenue",
      value: `$${(stats?.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FaDollarSign size={20} color="green" />,
      color: "bg-green-200",
      percent: "12%",
      label: "Compared to last month",
      trend: "up"
    },
    {
      title: "Total Orders",
      value: (stats?.totalOrders || 0).toLocaleString(),
      icon: <FaShoppingCart size={20} color="blue" />,
      color: "bg-blue-200",
      percent: "8%",
      label: "Compared to last month",
      trend: "up"
    },
    {
      title: "Total Products",
      value: (stats?.totalProducts || 0).toLocaleString(),
      icon: <FaBox size={20} color="purple" />,
      color: "bg-purple-200",
      percent: "5%",
      label: "Active products",
      trend: "up"
    },
    {
      title: "Avg. Order Value",
      value: `$${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FaTag size={16} color="orange" />,
      color: "bg-orange-200",
      percent: "3%",
      label: "Per order average",
      trend: "up"
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
              <h3 className="text-sm md:text-lg font-semibold text-gray-500">
                {item.title}
              </h3>
              <div className={`p-2 rounded-full ${item.color} text-white`}>
                {item.icon}
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              <div className="flex items-center gap-2 mb-1 w-fit relative">
                <p className="font-bold text-lg md:text-[30px]">{item.value}</p>
                <span className={`text-sm font-semibold flex items-center absolute right-[-40px] bottom-[-3px] ${
                  item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.trend === 'up' ? (
                    <FaArrowUp className="md:pt-1.5 md:text-xl" />
                  ) : (
                    <FaArrowDown className="md:pt-1.5 md:text-xl" />
                  )}
                  {item.percent}
                </span>
              </div>
              <p className="text-xs md:text-[12px] text-gray-500">
                {item.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
