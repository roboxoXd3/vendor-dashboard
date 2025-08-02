'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function VendorApplicationForm({ onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessEmail: user?.email || '',
    businessPhone: '',
    businessAddress: '',
    businessType: 'retail',
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

  const businessTypes = [
    { value: 'retail', label: 'Retail Store' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'dropshipper', label: 'Dropshipper' },
    { value: 'digital', label: 'Digital Products' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Other' }
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
      // Get the current session token
      console.log('🔄 Getting session for API call...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('🔍 Session data:', { 
        hasSession: !!session, 
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        sessionError: sessionError?.message 
      })
      
      if (!session) {
        throw new Error('No active session found')
      }

      console.log('🔄 Making API call to vendor-application...')
      const response = await fetch('/api/vendor-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData)
      })

      console.log('🔍 API Response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
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

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Application</h2>
        <p className="text-gray-600">
          Complete your vendor application to start selling on Be Smart Mall
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Your Business Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            <textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe your business, products, and services..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Email *
              </label>
              <input
                type="email"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="business@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone
              </label>
              <input
                type="tel"
                name="businessPhone"
                value={formData.businessPhone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address *
            </label>
            <textarea
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Complete business address including city, state, and ZIP code"
              required
            />
          </div>
        </div>

        {/* Legal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Legal Information</h3>
          
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

        {/* Payment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
          
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

        {/* Terms and Conditions */}
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

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
          
          {onCancel && (
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