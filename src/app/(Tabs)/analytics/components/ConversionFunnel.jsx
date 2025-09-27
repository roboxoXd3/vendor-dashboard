"use client";

import { FaArrowRight } from "react-icons/fa";
import { useConversionFunnel } from '@/hooks/useVendor';

export default function ConversionFunnel({ filters = {} }) {
  const { data: funnelData, isLoading, error } = useConversionFunnel(filters);

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl shadow p-6 w-full max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Product Conversion Funnel
          </h2>
        </div>
        <div className="w-full h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-6">
          Loading...
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-center min-w-[80px] animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white rounded-xl shadow p-6 w-full max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Product Conversion Funnel
          </h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading conversion funnel: {error}</p>
        </div>
      </section>
    );
  }

  const funnel = funnelData || {};
  const funnelSteps = [
    { label: "Product Views", value: (funnel.productViews || 0).toLocaleString(), percentage: "100%" },
    { label: "Add to Cart", value: (funnel.addToCart || 0).toLocaleString(), percentage: `${((funnel.addToCart || 0) / (funnel.productViews || 1) * 100).toFixed(1)}%` },
    { label: "Checkout Started", value: (funnel.checkoutStarted || 0).toLocaleString(), percentage: `${((funnel.checkoutStarted || 0) / (funnel.productViews || 1) * 100).toFixed(1)}%` },
    { label: "Purchased", value: (funnel.purchased || 0).toLocaleString(), percentage: `${((funnel.purchased || 0) / (funnel.productViews || 1) * 100).toFixed(1)}%` },
  ];

  return (
    <section className="bg-white rounded-xl shadow p-6 w-full max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-800">
          Product Conversion Funnel
        </h2>
        <div className="flex gap-3">
          <button className="text-sm text-gray-500 hover:text-gray-700">
            # Filter
          </button>
          <button className="text-sm text-gray-500 hover:text-gray-700">
            [ ] Expand
          </button>
        </div>
      </div>

      <div className="w-full h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-6">
        (Chart Placeholder)
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
        {funnelSteps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="text-center min-w-[80px]">
              <div className="text-sm text-gray-500">{step.label}</div>
              <div className="text-xl font-bold text-gray-800">
                {step.value}
              </div>
              <div className="text-xs text-gray-400">{step.percentage}</div>
            </div>
            {idx < funnelSteps.length - 1 && (
              <FaArrowRight className="hidden md:block text-gray-300 text-lg" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
