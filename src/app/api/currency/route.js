import { NextResponse } from 'next/server'
import { getBesmartBaseUrl } from '@/lib/besmart-api'

// GET /api/currency - Get supported currencies and current rates (public, Django)
export async function GET() {
  try {
    const response = await fetch(`${getBesmartBaseUrl()}/api/currency/rates/`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch currency rates' }, { status: response.status })
    }

    const { data } = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        supportedCurrencies: data?.supportedCurrencies || [],
        defaultCurrency: data?.defaultCurrency || { code: 'USD', symbol: '$', name: 'US Dollar' },
        exchangeRates: data?.exchangeRates || {},
        lastUpdated: data?.lastUpdated || new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Currency API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
