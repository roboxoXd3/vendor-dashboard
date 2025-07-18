import { FaArrowRight } from "react-icons/fa";

export default function ConversionFunnel() {
  const funnelData = [
    { label: "Product Views", value: "8,492", percentage: "100%" },
    { label: "Add to Cart", value: "1,254", percentage: "14.8%" },
    { label: "Checkout Started", value: "528", percentage: "6.2%" },
    { label: "Purchased", value: "412", percentage: "4.8%" },
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
        {funnelData.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="text-center min-w-[80px]">
              <div className="text-sm text-gray-500">{step.label}</div>
              <div className="text-xl font-bold text-gray-800">
                {step.value}
              </div>
              <div className="text-xs text-gray-400">{step.percentage}</div>
            </div>
            {idx < funnelData.length - 1 && (
              <FaArrowRight className="hidden md:block text-gray-300 text-lg" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
