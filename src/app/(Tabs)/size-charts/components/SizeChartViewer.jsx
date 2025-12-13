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
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 p-4 z-10 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Back to Size Charts"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1 mx-3">
            {chart.name}
          </h1>
          <button
            onClick={() => onEdit(chart)}
            className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Category: {chart.category_name || 'All Categories'}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chart.approval_status)}`}>
              {chart.approval_status}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDuplicate(chart)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this size chart?')) {
                  onDelete(chart.id);
                }
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0"
              title="Back to Size Charts"
            >
              <FaArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 break-words">
                {chart.name}
              </h1>
              <div className="flex flex-row items-center gap-4 text-sm text-gray-600">
                <span className="truncate">Category: {chart.category_name || 'All Categories'}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chart.approval_status)} w-fit`}>
                  {chart.approval_status}
                </span>
                <span className="text-sm">Created: {chart.created_at ? new Date(chart.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(chart)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <FaEdit size={14} /> Edit
            </button>
            <button
              onClick={() => onDuplicate(chart)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaCopy size={14} /> Duplicate
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this size chart?')) {
                  onDelete(chart.id);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FaTrash size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Total Sizes</h4>
            <p className="text-2xl font-bold text-gray-900">{(chart.template_data?.entries || chart.entries || []).length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Measurement Fields</h4>
            <p className="text-2xl font-bold text-gray-900">{chart.measurement_types?.length || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Chart Type</h4>
            <p className="text-lg font-semibold text-gray-900 capitalize">{chart.chart_type || 'Custom'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Dynamic Fields</h4>
            <p className="text-lg font-semibold text-gray-900">{chart.is_dynamic ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Mobile Size Chart Image */}
      {chart.image_url && (
        <div className="md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Size Chart Image</h3>
          <div className="rounded-lg overflow-hidden">
            <img
              src={chart.image_url}
              alt="Size chart"
              className="w-full h-auto object-contain bg-gray-50"
            />
          </div>
        </div>
      )}

      {/* Mobile Measurement Instructions */}
      {chart.measurement_instructions && (
        <div className="md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Measurement Instructions</h3>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-800 leading-relaxed">{chart.measurement_instructions}</p>
          </div>
        </div>
      )}

      {/* Desktop Size Chart Image */}
      {chart.image_url && (
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Chart Image</h3>
          <div className="rounded-lg overflow-hidden bg-gray-50 flex justify-center">
            <img
              src={chart.image_url}
              alt="Size chart"
              className="max-w-full h-auto max-h-96 object-contain"
            />
          </div>
        </div>
      )}

      {/* Desktop Measurement Instructions */}
      {chart.measurement_instructions && (
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Measurement Instructions</h3>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-base text-gray-800 leading-relaxed">{chart.measurement_instructions}</p>
          </div>
        </div>
      )}

      {/* Mobile Size Chart - Card Layout */}
      <div className="md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Size Chart</h3>
        
        <div className="space-y-4">
          {(chart.template_data?.entries || chart.entries || []).map((entry, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-center mb-4">
                <div className="inline-block bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-semibold text-lg">
                  Size {entry.size}
                </div>
              </div>
              
              <div className="space-y-3">
                {chart.measurement_types?.map(type => (
                  <div key={type} className="bg-white rounded-lg p-3 border border-gray-300">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 mb-1">{type}</h5>
                        <p className="text-xs text-gray-600">Measurement in centimeters</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 min-w-[60px]">
                        <span className="text-lg font-bold text-emerald-700">
                          {entry.measurements[type] || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Additional Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 How to Use This Size Chart</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Measure yourself according to the instructions above</li>
            <li>• Compare your measurements with the size chart</li>
            <li>• Choose the size that best matches your measurements</li>
            <li>• If you're between sizes, consider the fit you prefer (loose or fitted)</li>
          </ul>
        </div>
      </div>

      {/* Desktop Size Chart Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Chart</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-4 text-left font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">Size</th>
                  {chart.measurement_types?.map(type => (
                    <th key={type} className="border border-gray-300 p-4 text-center font-semibold text-gray-900 min-w-[120px]">
                      {type} (cm)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(chart.template_data?.entries || chart.entries || []).map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 p-4 font-semibold text-gray-900 bg-gray-50 sticky left-0 z-10">
                      {entry.size}
                    </td>
                    {chart.measurement_types?.map(type => (
                      <td key={type} className="border border-gray-300 p-4 text-center text-gray-700">
                        {entry.measurements[type] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Desktop Additional Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">How to Use This Size Chart</h4>
          <ul className="text-sm text-gray-600 space-y-1">
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

