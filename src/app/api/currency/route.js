import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { performSupabaseOperation, getErrorMessage } from '@/lib/supabase-utils'

// GET /api/currency - Get supported currencies and current rates
export async function GET(request) {
  try {
    const supabase = getSupabaseServer()
    
    // Get supported currencies from app_settings with retry logic
    const settingsResult = await performSupabaseOperation(
      () => supabase
        .from('app_settings')
        .select('setting_value')
        .in('setting_key', ['supported_currencies', 'default_currency']),
      'Fetch currency settings'
    )
    
    const { data: currencySettings, error: settingsError } = settingsResult
    
    if (settingsError) {
      console.error('Error fetching currency settings:', settingsError)
      const errorMessage = getErrorMessage(settingsError)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Get current exchange rates with retry logic
    const ratesResult = await performSupabaseOperation(
      () => supabase
        .from('currency_rates')
        .select('from_currency, to_currency, rate, updated_at')
        .order('updated_at', { ascending: false }),
      'Fetch currency rates'
    )
    
    const { data: rates, error: ratesError } = ratesResult

    if (ratesError) {
      console.error('Error fetching currency rates:', ratesError)
      const errorMessage = getErrorMessage(ratesError)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Process the data
    const supportedCurrencies = currencySettings.find(s => s.setting_value?.length)?.setting_value || []
    const defaultCurrency = currencySettings.find(s => s.setting_value?.code)?.setting_value || { code: 'USD', symbol: '$', name: 'US Dollar' }

    // Convert rates array to object for easier lookup
    const ratesMap = {}
    rates.forEach(rate => {
      if (!ratesMap[rate.from_currency]) {
        ratesMap[rate.from_currency] = {}
      }
      ratesMap[rate.from_currency][rate.to_currency] = {
        rate: parseFloat(rate.rate),
        updated_at: rate.updated_at
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        supportedCurrencies,
        defaultCurrency,
        exchangeRates: ratesMap,
        lastUpdated: rates[0]?.updated_at || new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Currency API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/currency - Update currency rates (admin only)
export async function POST(request) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { rates, adminUserId } = body

    if (!rates || !Array.isArray(rates)) {
      return NextResponse.json({ error: 'Invalid rates data' }, { status: 400 })
    }

    // Verify admin permissions (you can add more robust admin check here)
    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    // Update currency rates
    const updatePromises = rates.map(rate => 
      supabase
        .from('currency_rates')
        .upsert({
          from_currency: rate.from_currency,
          to_currency: rate.to_currency,
          rate: rate.rate,
          source: rate.source || 'manual',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'from_currency,to_currency'
        })
    )

    const results = await Promise.all(updatePromises)
    
    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Error updating currency rates:', errors)
      return NextResponse.json({ error: 'Failed to update some currency rates' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${rates.length} currency rates`,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Currency update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
