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
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className={`p-2 ${iconBgColor} rounded-lg flex-shrink-0`}>
          <Icon className={iconColor} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 text-xs sm:text-sm">{description}</p>
        </div>
      </div>

      {children}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between mt-6 sm:mt-8">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base order-2 sm:order-1"
          >
            ← {backLabel}
          </button>
        ) : (
          <div className="hidden sm:block"></div>
        )}
        
        {showNext && (
          <button
            type={isLastStep ? "submit" : "button"}
            onClick={isLastStep ? undefined : onNext}
            disabled={nextDisabled}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base order-1 sm:order-2 ${
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
