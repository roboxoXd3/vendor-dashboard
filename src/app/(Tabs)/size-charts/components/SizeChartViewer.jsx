"use client";
import { FaEdit, FaTimes, FaArrowLeft, FaCopy, FaTrash } from "react-icons/fa";

export default function SizeChartViewer({ 
  chart, 
  onEdit, 
  onClose,
  onDuplicate,
  onDelete
}) {
  if (!chart) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0"
              title="Back to Size Charts"
            >
              <FaArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                {chart.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <span className="truncate">Category: {chart.category_name || 'All Categories'}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chart.approval_status)} w-fit`}>
                  {chart.approval_status}
                </span>
                <span className="text-xs sm:text-sm">Created: {chart.created_at ? new Date(chart.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => onEdit(chart)}
              className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaEdit size={14} /> <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => onDuplicate(chart)}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaCopy size={14} /> <span className="hidden sm:inline">Duplicate</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this size chart?')) {
                  onDelete(chart.id);
                }
              }}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FaTrash size={14} /> <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Total Sizes</h4>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{(chart.template_data?.entries || chart.entries || []).length}</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Measurement Fields</h4>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{chart.measurement_types?.length || 0}</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Chart Type</h4>
            <p className="text-sm sm:text-lg font-semibold text-gray-900 capitalize">{chart.chart_type || 'Custom'}</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Dynamic Fields</h4>
            <p className="text-sm sm:text-lg font-semibold text-gray-900">{chart.is_dynamic ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Measurement Instructions */}
      {chart.measurement_instructions && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Measurement Instructions</h3>
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{chart.measurement_instructions}</p>
          </div>
        </div>
      )}

      {/* Size Chart Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Size Chart</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full px-4 sm:px-0">
            <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 sm:p-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">Size</th>
                  {chart.measurement_types?.map(type => (
                    <th key={type} className="border border-gray-300 p-2 sm:p-4 text-center font-semibold text-gray-900 min-w-[80px] sm:min-w-[100px]">
                      {type} (cm)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(chart.template_data?.entries || chart.entries || []).map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 p-2 sm:p-4 font-semibold text-gray-900 bg-gray-50 sticky left-0 z-10">
                      {entry.size}
                    </td>
                    {chart.measurement_types?.map(type => (
                      <td key={type} className="border border-gray-300 p-2 sm:p-4 text-center text-gray-700">
                        {entry.measurements[type] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">How to Use This Size Chart</h4>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
            <li>• Measure yourself according to the instructions above</li>
            <li>• Compare your measurements with the size chart</li>
            <li>• Choose the size that best matches your measurements</li>
            <li>• If you're between sizes, consider the fit you prefer (loose or fitted)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
