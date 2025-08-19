'use client'

const InfoTooltip = ({ text }) => {
  return (
    <div className="inline-block ml-1 group relative">
      <div className="text-gray-400 text-xs cursor-help">ⓘ</div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  )
}

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  tooltip,
  options = [],
  rows,
  min,
  max,
  step,
  className = "",
  children,
  colSpan = 1
}) {
  const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
  
  const getColSpanClass = () => {
    switch (colSpan) {
      case 2: return "md:col-span-2"
      case 3: return "md:col-span-3"
      default: return ""
    }
  }

  const renderInput = () => {
    if (children) {
      return children
    }

    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            rows={rows || 4}
            className={`${baseInputClasses} ${className}`}
            placeholder={placeholder}
          />
        )
      
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`${baseInputClasses} ${className}`}
          >
            {options.map((option, index) => (
              <option key={index} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            min={min}
            max={max}
            step={step}
            className={`${baseInputClasses} ${className}`}
            placeholder={placeholder}
          />
        )
    }
  }

  return (
    <div className={getColSpanClass()}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
      )}
      {renderInput()}
    </div>
  )
}
