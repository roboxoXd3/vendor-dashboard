"use client";

import { FaEye, FaPercentage, FaTag } from "react-icons/fa";
import { RiArrowGoBackLine } from "react-icons/ri";
import { FaArrowUp } from "react-icons/fa6";
import { useAnalyticsMetrics } from '@/hooks/useVendor';
import { useCurrencyContext } from '@/contexts/CurrencyContext';

export default function AnalyticsPageCards({ filters = {} }) {
  const { data: metricsData, isLoading, error } = useAnalyticsMetrics(filters);
  const { formatPrice } = useCurrencyContext();

  if (isLoading) {
    return (
      <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white shadow-sm rounded-lg p-5 animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading analytics metrics: {error}</p>
        </div>
      </div>
    );
  }

  const metrics = metricsData || {};
  const items = [
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate || 0}%`,
      icon: <FaPercentage color="green" />,
      color: "bg-green-200",
    },
    {
      title: "Avg. Order Value",
      value: formatPrice(metrics.avgOrderValue || 0),
      icon: <FaTag color="brown" size={13} />,
      color: "bg-yellow-200",
    },
    {
      title: "Return Rate",
      value: `${metrics.returnRate || 0}%`,
      icon: <RiArrowGoBackLine color="red" />,
      color: "bg-red-200",
      
    },
    {
      title: "Total Views",
      value: (metrics.totalViews || 0).toLocaleString(),
      icon: <FaEye color="blue" />,
      color: "bg-blue-200",
    },
  ];
  return (
    <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-500">{item.title}</h3>
            <div className={`p-2 rounded-full ${item.color}`}>{item.icon}</div>
          </div>
          <div className="mt-2 flex flex-col">
            <div className="flex items-center gap-2 mb-2 w-fit relative">
              <p className="font-bold text-lg md:text-[30px]">{item.value}</p>
       
            </div>
            <p className="text-xs md:text-[12px] text-gray-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
