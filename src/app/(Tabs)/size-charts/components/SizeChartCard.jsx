"use client";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

export default function SizeChartCard({ 
  chart, 
  onEdit, 
  onDelete, 
  onView
}) {
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

  // Show a preview of the size chart data
  const entries = chart.template_data?.entries || chart.entries || [];
  const previewSizes = entries.slice(0, 3);
  const hasMoreSizes = entries.length > 3;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(chart)}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {chart.name}
          </h3>
          <p className="text-sm text-gray-600">
            {chart.category_name || 'All Categories'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(chart);
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chart.id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>
      
      {/* Image Preview (if uploaded) */}
      {chart.image_url && (
        <div className="mb-4">
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={chart.image_url}
              alt="Size chart"
              className="w-full h-32 object-contain"
              loading="lazy"
            />
          </div>
        </div>
      )}
      
      {/* Size Chart Preview */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Size Chart Preview</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-2 text-left">Size</th>
                {chart.measurement_types?.slice(0, 3).map(type => (
                  <th key={type} className="border border-gray-200 p-2 text-center">
                    {type}
                  </th>
                ))}
                {chart.measurement_types?.length > 3 && (
                  <th className="border border-gray-200 p-2 text-center">...</th>
                )}
              </tr>
            </thead>
            <tbody>
              {previewSizes.map((entry, index) => (
                <tr key={index}>
                  <td className="border border-gray-200 p-2 font-medium">
                    {entry.size}
                  </td>
                  {chart.measurement_types?.slice(0, 3).map(type => (
                    <td key={type} className="border border-gray-200 p-2 text-center">
                      {entry.measurements[type] || '-'}
                    </td>
                  ))}
                  {chart.measurement_types?.length > 3 && (
                    <td className="border border-gray-200 p-2 text-center">...</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMoreSizes && (
          <p className="text-xs text-gray-500 mt-1">
            +{entries.length - 3} more sizes
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>Total Sizes:</span>
          <span className="font-medium">{entries.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Measurement Fields:</span>
          <span className="font-medium">{chart.measurement_types?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chart.approval_status)}`}>
            {chart.approval_status}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(chart);
          }}
          className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors"
        >
          <FaEye size={14} /> View Full Size Chart
        </button>
      </div>
    </div>
  );
}
