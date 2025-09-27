"use client";
import { FaPlus, FaRuler } from "react-icons/fa";

export default function EmptyState({ onCreateSizeChart }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaRuler size={24} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No size charts yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Create your first size chart to help customers choose the right size for your products. 
        You can add custom measurement fields and create detailed sizing guides.
      </p>
      <button
        onClick={onCreateSizeChart}
        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 mx-auto"
      >
        <FaPlus size={16} />
        Create Your First Size Chart
      </button>
    </div>
  );
}
