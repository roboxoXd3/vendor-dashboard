"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaSave, FaTimes } from "react-icons/fa";

export default function SizeChartForm({ 
  chart = null, 
  onSave, 
  onCancel, 
  categories = [],
  loading = false 
}) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    measurement_types: ['Chest', 'Waist', 'Length'],
    measurement_instructions: '',
    entries: [
      { size: 'S', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
      { size: 'M', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
      { size: 'L', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
    ]
  });

  const [newFieldName, setNewFieldName] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    if (chart) {
      // Parse the template_data if it exists
      let entries = chart.template_data?.entries || chart.entries || [];
      
      setFormData({
        name: chart.name || '',
        category_id: chart.category_id || '',
        measurement_types: chart.measurement_types || ['Chest', 'Waist', 'Length'],
        measurement_instructions: chart.measurement_instructions || '',
        entries: entries.length > 0 ? entries : [
          { size: 'S', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
          { size: 'M', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
          { size: 'L', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
        ]
      });
    }
  }, [chart]);

  const getDefaultMeasurementTypes = (categoryName) => {
    if (!categoryName) return ['Chest', 'Waist', 'Length'];
    
    const category = categoryName.toLowerCase();
    
    if (category.includes('trouser') || category.includes('pant') || category.includes('jeans') || category.includes('bottom')) {
      return ['Waist', 'Hip', 'Length', 'Thigh', 'Knee'];
    }
    
    if (category.includes('shirt') || category.includes('top') || category.includes('t-shirt') || category.includes('blouse')) {
      return ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve'];
    }
    
    if (category.includes('dress')) {
      return ['Chest', 'Waist', 'Hip', 'Length', 'Shoulder'];
    }
    
    if (category.includes('jacket') || category.includes('coat')) {
      return ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve'];
    }
    
    if (category.includes('shoe') || category.includes('footwear')) {
      return ['Length', 'Width'];
    }
    
    if (category.includes('accessory') || category.includes('jewelry')) {
      return ['Circumference', 'Length'];
    }
    
    return ['Chest', 'Waist', 'Length'];
  };

  const handleCategoryChange = (categoryId) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    const defaultTypes = getDefaultMeasurementTypes(selectedCategory?.name);
    
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      measurement_types: defaultTypes,
      entries: prev.entries.map(entry => {
        const newMeasurements = {};
        defaultTypes.forEach(type => {
          newMeasurements[type] = entry.measurements[type] || '';
        });
        return { ...entry, measurements: newMeasurements };
      })
    }));
  };

  const addField = () => {
    if (newFieldName.trim() && !formData.measurement_types.includes(newFieldName.trim())) {
      const fieldName = newFieldName.trim();
      setFormData(prev => ({
        ...prev,
        measurement_types: [...prev.measurement_types, fieldName],
        entries: prev.entries.map(entry => ({
          ...entry,
          measurements: { ...entry.measurements, [fieldName]: '' }
        }))
      }));
      setNewFieldName('');
      setShowAddField(false);
    }
  };

  const removeField = (fieldName) => {
    if (formData.measurement_types.length > 1) {
      setFormData(prev => ({
        ...prev,
        measurement_types: prev.measurement_types.filter(type => type !== fieldName),
        entries: prev.entries.map(entry => {
          const newMeasurements = { ...entry.measurements };
          delete newMeasurements[fieldName];
          return { ...entry, measurements: newMeasurements };
        })
      }));
    }
  };

  const addSize = () => {
    const newSize = `Size ${formData.entries.length + 1}`;
    const newEntry = {
      size: newSize,
      measurements: {}
    };
    
    formData.measurement_types.forEach(type => {
      newEntry.measurements[type] = '';
    });
    
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry]
    }));
  };

  const removeSize = (index) => {
    if (formData.entries.length > 1) {
      setFormData(prev => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {chart ? 'Edit Size Chart' : 'Create New Size Chart'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <FaTimes size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size Chart Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Men's T-Shirt Sizing"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 Selecting a category will automatically set appropriate measurement types
            </p>
          </div>
        </div>

        {/* Measurement Types */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Measurement Types
            </label>
            <button
              type="button"
              onClick={() => setShowAddField(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <FaPlus size={12} /> Add Field
            </button>
          </div>
          
          {showAddField && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Enter field name (e.g., Shoulder, Hip)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
              />
              <button
                type="button"
                onClick={addField}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddField(false);
                  setNewFieldName('');
                }}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.measurement_types.map((type, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
              >
                {type}
                {formData.measurement_types.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(type)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            💡 Common measurements: Chest (for tops), Waist (for bottoms), Length (for all), Hip (for dresses/bottoms)
          </p>
        </div>

        {/* Measurement Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Measurement Instructions
          </label>
          <textarea
            value={formData.measurement_instructions}
            onChange={(e) => setFormData(prev => ({ ...prev, measurement_instructions: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Instructions for customers on how to measure..."
          />
        </div>

        {/* Size Chart Data */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Size Chart Data
            </label>
            <button
              type="button"
              onClick={addSize}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-1"
            >
              <FaPlus size={12} /> Add Size
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Size</th>
                  {formData.measurement_types.map(type => (
                    <th key={type} className="border border-gray-300 p-3 text-center">
                      {type} (cm)
                    </th>
                  ))}
                  <th className="border border-gray-300 p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.entries.map((entry, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3">
                      <input
                        type="text"
                        value={entry.size}
                        onChange={(e) => {
                          const newEntries = [...formData.entries];
                          newEntries[index].size = e.target.value;
                          setFormData(prev => ({ ...prev, entries: newEntries }));
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    {formData.measurement_types.map(type => (
                      <td key={type} className="border border-gray-300 p-3">
                        <input
                          type="number"
                          step="0.1"
                          value={entry.measurements[type] || ''}
                          onChange={(e) => {
                            const newEntries = [...formData.entries];
                            newEntries[index].measurements[type] = e.target.value;
                            setFormData(prev => ({ ...prev, entries: newEntries }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="0.0"
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 p-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="text-red-600 hover:text-red-800"
                        disabled={formData.entries.length <= 1}
                      >
                        <FaTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaSave size={14} />
            {loading ? 'Saving...' : (chart ? 'Update Size Chart' : 'Create Size Chart')}
          </button>
        </div>
      </form>
    </div>
  );
}
