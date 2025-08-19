'use client'

export default function StepContainer({ 
  icon: Icon, 
  iconBgColor = "bg-blue-100", 
  iconColor = "text-blue-600", 
  title, 
  description, 
  children, 
  onNext, 
  onBack, 
  nextLabel = "Next", 
  backLabel = "Back",
  showBack = true,
  showNext = true,
  nextDisabled = false,
  isLastStep = false
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={iconColor} size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>

      {children}

      <div className="flex justify-between mt-8">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            ← {backLabel}
          </button>
        ) : (
          <div></div>
        )}
        
        {showNext && (
          <button
            type={isLastStep ? "submit" : "button"}
            onClick={isLastStep ? undefined : onNext}
            disabled={nextDisabled}
            className={`px-6 py-3 rounded-lg font-medium ${
              nextDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {nextLabel} {!isLastStep && '→'}
          </button>
        )}
      </div>
    </div>
  )
}
