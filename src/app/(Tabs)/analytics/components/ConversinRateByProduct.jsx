export default function ConversionRateByProduct() {
  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-md font-semibold">Conversion Rate by Product</h3>
        <button className="cursor-pointer text-sm text-[var(--color-theme)]">
          View All
        </button>
      </div>

      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        (Chart Placeholder)
      </div>
    </div>
  );
}
