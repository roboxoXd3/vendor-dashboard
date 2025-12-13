"use client";
import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaSave, FaTimes, FaImage, FaUpload } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "@/components/ImageUpload";

export default function SizeChartForm({ 
  chart = null, 
  onSave, 
  onCancel, 
  categories = [],
  loading = false 
}) {
  const { vendor } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    measurement_types: ['Chest', 'Waist', 'Length'],
    measurement_instructions: '',
    image_url: '',
    entries: [
      { size: 'S', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
      { size: 'M', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
      { size: 'L', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
    ]
  });

  const [newFieldName, setNewFieldName] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [oldImageUrl, setOldImageUrl] = useState(null);

  useEffect(() => {
    if (chart) {
      // Parse the template_data if it exists
      let entries = chart.template_data?.entries || chart.entries || [];
      
      setFormData({
        name: chart.name || '',
        category_id: chart.category_id || '',
        measurement_types: chart.measurement_types || ['Chest', 'Waist', 'Length'],
        measurement_instructions: chart.measurement_instructions || '',
        image_url: chart.image_url || '',
        entries: entries.length > 0 ? entries : [
          { size: 'S', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
          { size: 'M', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
          { size: 'L', measurements: { 'Chest': '', 'Waist': '', 'Length': '' } },
        ]
      });
      // Track the original image URL for deletion if changed
      setOldImageUrl(chart.image_url || null);
    } else {
      setOldImageUrl(null);
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

  // Helper function to delete image from storage
  const deleteImageFromStorage = async (imageUrl) => {
    if (!imageUrl) return;

    try {
      // Extract bucket and path from URL
      // Supabase storage URL format: https://project.supabase.co/storage/v1/object/public/BUCKET/PATH
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      
      // Find 'storage' in path and extract bucket and file path
      const storageIndex = pathParts.indexOf('storage');
      if (storageIndex !== -1 && pathParts.length > storageIndex + 4) {
        const bucket = pathParts[storageIndex + 4];
        const filePath = pathParts.slice(storageIndex + 5).join('/');

        // Call API to delete the image
        const response = await fetch('/api/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, path: filePath })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to delete image:', error);
        } else {
          console.log('✅ Deleted old image from storage:', filePath);
        }
      } else {
        console.warn('Could not parse image URL for deletion:', imageUrl);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImageUpload = async (imageUrl) => {
    // If there was an old image, delete it from storage
    if (oldImageUrl && oldImageUrl !== imageUrl) {
      await deleteImageFromStorage(oldImageUrl);
    }
    
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
    setOldImageUrl(imageUrl); // Update old image to new one
    setUploadingImage(false);
  };

  const handleImageRemove = async () => {
    // Delete the current image from storage
    if (formData.image_url) {
      await deleteImageFromStorage(formData.image_url);
    }
    
    setFormData(prev => ({ ...prev, image_url: '' }));
    setOldImageUrl(null);
  };

  const handleImageError = (error) => {
    console.error('Image upload error:', error);
    alert(`Failed to upload image: ${error}`);
    setUploadingImage(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white min-h-screen md:min-h-auto md:rounded-lg md:shadow-sm md:border md:border-gray-200">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:hidden z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {chart ? 'Edit Size Chart' : 'Create Size Chart'}
          </h1>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-6 pb-0">
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
      </div>

      {/* Mobile Form */}
      <form onSubmit={handleSubmit} className="md:hidden space-y-0">
        <div className="p-4 space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Size Chart Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                placeholder="e.g., Men's T-Shirt Sizing"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded-lg">
                💡 Selecting a category will automatically set appropriate measurement types
              </p>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Size Chart Image (Optional)
              </label>
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Size chart preview"
                    className="w-full h-48 object-contain border border-gray-300 rounded-xl bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              ) : (
                <ImageUpload
                  vendorId={vendor?.id}
                  productId={null}
                  type="size-charts"
                  onUploadSuccess={handleImageUpload}
                  onUploadError={handleImageError}
                  onRemoveImage={handleImageRemove}
                  existingImages={[]}
                  multiple={false}
                  className="w-full"
                />
              )}
              <p className="text-xs text-gray-500 mt-2">
                💡 Upload an image to visually represent the size chart (e.g., measurement guide diagram)
              </p>
            </div>
          </div>

          {/* Mobile Measurement Types */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Measurement Types
              </label>
              <button
                type="button"
                onClick={() => setShowAddField(true)}
                className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-1"
              >
                <FaPlus size={12} /> Add Field
              </button>
            </div>
            
            {showAddField && (
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Enter field name (e.g., Shoulder, Hip)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={addField}
                      className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-base font-medium"
                    >
                      Add Field
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddField(false);
                        setNewFieldName('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
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
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
              💡 Common measurements: Chest (for tops), Waist (for bottoms), Length (for all), Hip (for dresses/bottoms)
            </p>
          </div>

          {/* Mobile Measurement Instructions */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Measurement Instructions
            </label>
            <textarea
              value={formData.measurement_instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, measurement_instructions: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base resize-none"
              placeholder="Instructions for customers on how to measure..."
            />
          {/* Mobile Size Chart Data */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Size Chart Data
              </label>
              <button
                type="button"
                onClick={addSize}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 flex items-center gap-2"
              >
                <FaPlus size={14} /> Add Size
              </button>
            </div>

            {/* Mobile Card-based Size Chart */}
            <div className="space-y-4">
              {formData.entries.map((entry, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Size {entry.size}</h4>
                    {formData.entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={entry.size}
                    onChange={(e) => {
                      const newEntries = [...formData.entries];
                      newEntries[index].size = e.target.value;
                      setFormData(prev => ({ ...prev, entries: newEntries }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm bg-white"
                    placeholder="Size (e.g., S, M, L)"
                  />

                  <div className="grid grid-cols-1 gap-3">
                    {formData.measurement_types.map(type => (
                      <div key={type} className="bg-white rounded-lg p-3">
                        <label className="block text-xs text-gray-600 mb-1">{type} (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={entry.measurements[type] || ''}
                          onChange={(e) => {
                            const newEntries = [...formData.entries];
                            newEntries[index].measurements[type] = e.target.value;
                            setFormData(prev => ({ ...prev, entries: newEntries }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                          placeholder="0.0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Size Chart Table */}
          <div className="hidden md:block overflow-x-auto">
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
      </div>

      {/* Mobile Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:hidden">
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 text-base font-medium"
            >
              <FaSave size={16} />
              {loading ? 'Saving...' : (chart ? 'Update Size Chart' : 'Create Size Chart')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Desktop Form */}
      <form onSubmit={handleSubmit} className="hidden md:block p-6 pt-0 space-y-6">
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

        {/* Image Upload Section - Desktop */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size Chart Image (Optional)
          </label>
          {formData.image_url ? (
            <div className="relative inline-block">
              <img
                src={formData.image_url}
                alt="Size chart preview"
                className="max-w-full h-64 object-contain border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
              >
                <FaTimes size={12} />
              </button>
            </div>
          ) : (
            <ImageUpload
              vendorId={vendor?.id}
              productId={null}
              type="size-charts"
              onUploadSuccess={handleImageUpload}
              onUploadError={handleImageError}
              onRemoveImage={handleImageRemove}
              existingImages={[]}
              multiple={false}
              className="w-full"
            />
          )}
          <p className="text-xs text-gray-500 mt-1">
            💡 Upload an image to visually represent the size chart (e.g., measurement guide diagram)
          </p>
        </div>

        {/* Desktop Measurement Types */}
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

        {/* Desktop Measurement Instructions */}
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

        {/* Desktop Size Chart Data */}
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

        {/* Desktop Actions */}
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
