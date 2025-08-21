'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Building, Mail, Phone, MapPin, FileText, User, CreditCard } from 'lucide-react'

export default function VendorApplication({ onSuccess, onCancel, mode = 'quick' }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(mode === 'quick' ? 1 : 2) // Skip intro for detailed mode
  
  // Get user metadata from Supabase Auth (stored during registration)
  const getUserMetadata = () => {
    if (!user) {
      console.log('❌ No user found for prefilling')
      return {}
    }
    
    // Access user metadata stored during registration
    const metadata = user.user_metadata || {}
    console.log('🔍 User object:', user)
    console.log('🔍 User metadata for prefilling:', metadata)
    console.log('🔍 User email:', user.email)
    
    return {
      businessName: metadata.business_name || '',
      businessEmail: user.email || '',
      businessPhone: metadata.phone || '',
      businessType: metadata.business_type || 'individual',
      fullName: metadata.full_name || ''
    }
  }
  
  const [userMetadata, setUserMetadata] = useState({})
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessType: 'individual',
    businessRegistrationNumber: '',
    taxId: '',
    paymentMethodPreference: 'bank_transfer',
    bankAccountInfo: {
      accountHolderName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: ''
    }
  })

  // Initialize form data when user is available
  useEffect(() => {
    if (user) {
      const metadata = getUserMetadata()
      setUserMetadata(metadata)
      
      setFormData(prev => ({
        ...prev,
        businessName: metadata.businessName,
        businessEmail: metadata.businessEmail,
        businessPhone: metadata.businessPhone,
        businessType: metadata.businessType,
        bankAccountInfo: {
          ...prev.bankAccountInfo,
          accountHolderName: metadata.fullName
        }
      }))
      
      console.log('✅ Form data initialized with:', {
        businessName: metadata.businessName,
        businessEmail: metadata.businessEmail,
        businessPhone: metadata.businessPhone,
        businessType: metadata.businessType
      })
    }
  }, [user])

  const businessTypes = [
    { value: 'individual', label: 'Individual/Sole Proprietorship' },
    { value: 'company', label: 'Company/Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llc', label: 'LLC (Limited Liability Company)' }
  ]

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'check', label: 'Check' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('bank_')) {
      const bankField = name.replace('bank_', '')
      setFormData(prev => ({
        ...prev,
        bankAccountInfo: {
          ...prev.bankAccountInfo,
          [bankField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔄 Submitting vendor application...', { mode, formData })
      
      // Use different API endpoints based on mode
      const apiEndpoint = mode === 'quick' 
        ? '/api/auth/create-vendor-profile' 
        : '/api/vendor-application'
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Application submission failed')
      }

      console.log('✅ Vendor application submitted successfully')
      onSuccess && onSuccess(result)
      
    } catch (err) {
      console.error('❌ Application submission error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Introduction (only for quick mode)
  if (step === 1 && mode === 'quick') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="bg-emerald-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <Building className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Vendor</h2>
          <p className="text-gray-600">
            Join thousands of successful vendors on Be Smart Mall and start selling your products today!
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
            <div className="bg-emerald-100 rounded-full p-2 mr-3">
              <span className="text-emerald-600 font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick Setup</h3>
              <p className="text-sm text-gray-600">Get started in just 2 minutes</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <span className="text-blue-600 font-bold">$</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Low Commission</h3>
              <p className="text-sm text-gray-600">Only 10% per sale</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
            <div className="bg-purple-100 rounded-full p-2 mr-3">
              <span className="text-purple-600 font-bold">⚡</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fast Approval</h3>
              <p className="text-sm text-gray-600">Review within 1-3 business days</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setStep(2)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Start Application
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>
      </div>
    )
  }

  // Step 2: Application Form
  const isQuickMode = mode === 'quick'
  const maxWidth = isQuickMode ? 'max-w-lg' : 'max-w-2xl'

  return (
    <div className={`${maxWidth} mx-auto bg-white rounded-lg shadow-lg p-6`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Application</h2>
        <p className="text-gray-600">
          {isQuickMode 
            ? 'Tell us about your business to get started'
            : 'Complete your vendor application to start selling on Be Smart Mall'
          }
        </p>
        
        {/* Prefill notification */}
        {(userMetadata.businessName || userMetadata.businessPhone || userMetadata.businessEmail) && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700">
              ✓ Some fields have been prefilled from your registration. You can edit them if needed.
            </p>
          </div>
        )}
        
        {isQuickMode && (
          <>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full w-full"></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Step 2 of 2</p>
          </>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building className="h-5 w-5 mr-2 text-emerald-600" />
            Business Information
          </h3>
          
          <div className={isQuickMode ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
            <div className={isQuickMode ? '' : 'md:col-span-1'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className={`w-full ${isQuickMode ? 'pl-10' : ''} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="Your Business Name"
                  required
                />
                {isQuickMode && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className={isQuickMode ? '' : 'md:col-span-1'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Description *
            </label>
            <div className="relative">
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleInputChange}
                rows={isQuickMode ? 3 : 4}
                className={`w-full ${isQuickMode ? 'pl-10' : ''} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                placeholder={isQuickMode ? "Briefly describe your business and products..." : "Describe your business, products, and services..."}
                required
              />
              {isQuickMode && (
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className={isQuickMode ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleInputChange}
                  className={`w-full ${isQuickMode ? 'pl-10' : ''} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="business@example.com"
                  required
                />
                {isQuickMode && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleInputChange}
                  className={`w-full ${isQuickMode ? 'pl-10' : ''} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="+1 (555) 123-4567"
                />
                {isQuickMode && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address *
            </label>
            <div className="relative">
              <textarea
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                rows={isQuickMode ? 2 : 3}
                className={`w-full ${isQuickMode ? 'pl-10' : ''} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                placeholder={isQuickMode ? "Complete business address" : "Complete business address including city, state, and ZIP code"}
                required
              />
              {isQuickMode && (
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legal Information - Only for detailed mode */}
        {!isQuickMode && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-emerald-600" />
              Legal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Business license or registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID / EIN
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Tax identification number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Information - Only for detailed mode */}
        {!isQuickMode && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
              Payment Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Payment Method *
              </label>
              <select
                name="paymentMethodPreference"
                value={formData.paymentMethodPreference}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.paymentMethodPreference === 'bank_transfer' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Bank Account Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      name="bank_accountHolderName"
                      value={formData.bankAccountInfo.accountHolderName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Full name on account"
                      required={formData.paymentMethodPreference === 'bank_transfer'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      name="bank_bankName"
                      value={formData.bankAccountInfo.bankName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Bank name"
                      required={formData.paymentMethodPreference === 'bank_transfer'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      name="bank_accountNumber"
                      value={formData.bankAccountInfo.accountNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Account number"
                      required={formData.paymentMethodPreference === 'bank_transfer'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number *
                    </label>
                    <input
                      type="text"
                      name="bank_routingNumber"
                      value={formData.bankAccountInfo.routingNumber}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Routing number"
                      required={formData.paymentMethodPreference === 'bank_transfer'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* What happens next - For quick mode */}
        {isQuickMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your application will be reviewed within 1-3 business days</li>
              <li>• You'll receive an email notification about the status</li>
              <li>• Once approved, you can start adding products immediately</li>
            </ul>
          </div>
        )}

        {/* Terms and Conditions - For detailed mode */}
        {!isQuickMode && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Terms & Conditions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Commission rate: 10% per sale</li>
                <li>• Payout schedule: Monthly</li>
                <li>• Minimum payout: $50</li>
                <li>• Application review: 1-3 business days</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {isQuickMode && step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`${isQuickMode && step === 2 ? 'flex-1' : 'flex-1'} bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isQuickMode ? 'Submitting...' : 'Submitting Application...'}
              </>
            ) : (
              isQuickMode ? 'Submit Application' : 'Submit Application'
            )}
          </button>
          
          {onCancel && !isQuickMode && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
