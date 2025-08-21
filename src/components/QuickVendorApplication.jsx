'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabase } from '@/lib/supabase'
import { Building, Mail, Phone, MapPin, FileText } from 'lucide-react'

export default function QuickVendorApplication({ onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessEmail: user?.email || '',
    businessPhone: '',
    businessAddress: '',
    businessType: 'individual'
  })

  const businessTypes = [
    { value: 'individual', label: 'Individual/Sole Proprietorship' },
    { value: 'company', label: 'Company/Corporation' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llc', label: 'LLC (Limited Liability Company)' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get the current session token
      console.log('🔄 Getting session for API call...')
      const supabase = getSupabase()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session found')
      }

      console.log('🔄 Creating vendor profile...')
      const response = await fetch('/api/auth/create-vendor-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Profile creation failed')
      }

      console.log('✅ Vendor profile created successfully')
      onSuccess && onSuccess(result)
      
    } catch (err) {
      console.error('❌ Profile creation error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
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

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Application</h2>
        <p className="text-gray-600">
          Tell us about your business to get started
        </p>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div className="bg-emerald-600 h-2 rounded-full w-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Step 2 of 2</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <div className="relative">
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Your Business Name"
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description *
          </label>
          <div className="relative">
            <textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Briefly describe your business and products..."
              required
            />
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="business@example.com"
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="+1 (555) 123-4567"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
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
              rows={2}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Complete business address"
              required
            />
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your application will be reviewed within 1-3 business days</li>
            <li>• You'll receive an email notification about the status</li>
            <li>• Once approved, you can start adding products immediately</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
