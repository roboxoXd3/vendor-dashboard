import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔧 Supabase Key (first 50 chars):', supabaseAnonKey?.substring(0, 50) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Prevent URL detection issues
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'vendor-dashboard-auth-token', // Custom storage key for vendor dashboard
    flowType: 'pkce' // Use PKCE flow for better security
  }
})

// Database table helpers for easy reference
export const tables = {
  vendors: 'vendors',
  products: 'products',
  orders: 'orders',
  order_items: 'order_items',
  vendor_payouts: 'vendor_payouts',
  reviews: 'reviews',
  support_tickets: 'support_tickets',
  support_messages: 'support_messages',
  vendor_analytics: 'vendor_analytics',
  profiles: 'profiles',
  categories: 'categories',
  shipping_addresses: 'shipping_addresses',
  order_tracking: 'order_tracking'
}

// Helper function to get current vendor
export const getCurrentVendor = async (userId) => {
  if (!userId) return null
  
  try {
    const { data, error } = await supabase
      .from(tables.vendors)
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return null
  }
}

// Helper function to check if user is authenticated vendor
export const isAuthenticatedVendor = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false
    
    const vendor = await getCurrentVendor(user.id)
    return vendor && vendor.status === 'approved'
  } catch (error) {
    console.error('Error checking vendor auth:', error)
    return false
  }
}