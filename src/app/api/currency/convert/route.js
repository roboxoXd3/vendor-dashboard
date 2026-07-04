import { NextResponse } from 'next/server'
import { getBesmartBaseUrl } from '@/lib/besmart-api'

async function convertViaDjango(amount, fromCurrency, toCurrency) {
  const response = await fetch(`${getBesmartBaseUrl()}/api/currency/convert/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, from_currency: fromCurrency, to_currency: toCurrency }),
  })
  if (!response.ok) return null
  return response.json()
}

// POST /api/currency/convert - Convert a set of prices to multiple target currencies
export async function POST(request) {
  try {
    const body = await request.json()
    const { prices, fromCurrency, targetCurrencies } = body

    if (!prices || !fromCurrency) {
      return NextResponse.json({ error: 'Missing required fields: prices, fromCurrency' }, { status: 400 })
    }

    const currencies = targetCurrencies || ['USD', 'EUR', 'GBP', 'INR', 'NGN']
    const convertedPrices = {}

    await Promise.all(
      currencies.map(async (targetCurrency) => {
        if (targetCurrency === fromCurrency) {
          convertedPrices[targetCurrency] = prices
          return
        }

        const [priceResult, mrpResult, saleResult] = await Promise.all([
          prices.price ? convertViaDjango(prices.price, fromCurrency, targetCurrency) : null,
          prices.mrp ? convertViaDjango(prices.mrp, fromCurrency, targetCurrency) : null,
          prices.sale_price ? convertViaDjango(prices.sale_price, fromCurrency, targetCurrency) : null,
        ])

        if (priceResult) {
          convertedPrices[targetCurrency] = {
            price: priceResult.converted_amount ?? null,
            mrp: mrpResult?.converted_amount ?? null,
            sale_price: saleResult?.converted_amount ?? null,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        convertedPrices,
        fromCurrency,
        conversionTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/currency/convert?amount=100&from=USD&to=EUR
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const amount = parseFloat(searchParams.get('amount'))
    const fromCurrency = searchParams.get('from')
    const toCurrency = searchParams.get('to')

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json({ error: 'Missing required parameters: amount, from, to' }, { status: 400 })
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({
        success: true,
        data: { originalAmount: amount, convertedAmount: amount, fromCurrency, toCurrency, rate: 1 }
      })
    }

    const result = await convertViaDjango(amount, fromCurrency, toCurrency)
    if (!result) {
      return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount: result.converted_amount,
        fromCurrency,
        toCurrency,
        rate: result.rate
      }
    })

  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
