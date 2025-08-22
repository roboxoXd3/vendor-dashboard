import { getSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/currency/convert - Convert prices for products
export async function POST(request) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const { productId, prices, fromCurrency, targetCurrencies } = body

    if (!prices || !fromCurrency) {
      return NextResponse.json({ error: 'Missing required fields: prices, fromCurrency' }, { status: 400 })
    }

    // Get current exchange rates
    const { data: rates, error: ratesError } = await supabase
      .from('currency_rates')
      .select('from_currency, to_currency, rate')
      .or(`from_currency.eq.${fromCurrency},to_currency.eq.${fromCurrency}`)

    if (ratesError) {
      console.error('Error fetching currency rates:', ratesError)
      return NextResponse.json({ error: 'Failed to fetch currency rates' }, { status: 500 })
    }

    // Create rates lookup
    const ratesMap = {}
    rates.forEach(rate => {
      if (!ratesMap[rate.from_currency]) {
        ratesMap[rate.from_currency] = {}
      }
      ratesMap[rate.from_currency][rate.to_currency] = parseFloat(rate.rate)
    })

    // Convert prices to all target currencies
    const convertedPrices = {}
    const currencies = targetCurrencies || ['USD', 'EUR', 'GBP', 'INR', 'NGN']

    currencies.forEach(targetCurrency => {
      if (targetCurrency === fromCurrency) {
        // Same currency, no conversion needed
        convertedPrices[targetCurrency] = prices
      } else {
        // Find conversion rate
        let conversionRate = null
        
        // Direct rate from fromCurrency to targetCurrency
        if (ratesMap[fromCurrency] && ratesMap[fromCurrency][targetCurrency]) {
          conversionRate = ratesMap[fromCurrency][targetCurrency]
        }
        // Inverse rate from targetCurrency to fromCurrency
        else if (ratesMap[targetCurrency] && ratesMap[targetCurrency][fromCurrency]) {
          conversionRate = 1 / ratesMap[targetCurrency][fromCurrency]
        }

        if (conversionRate) {
          convertedPrices[targetCurrency] = {
            price: prices.price ? Math.round(prices.price * conversionRate * 100) / 100 : null,
            mrp: prices.mrp ? Math.round(prices.mrp * conversionRate * 100) / 100 : null,
            sale_price: prices.sale_price ? Math.round(prices.sale_price * conversionRate * 100) / 100 : null
          }
        }
      }
    })

    // If productId is provided, update the product's converted_prices
    if (productId) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          converted_prices: convertedPrices,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) {
        console.error('Error updating product converted prices:', updateError)
        return NextResponse.json({ error: 'Failed to update product prices' }, { status: 500 })
      }
    }

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
        data: {
          originalAmount: amount,
          convertedAmount: amount,
          fromCurrency,
          toCurrency,
          rate: 1
        }
      })
    }

    const supabase = getSupabaseServer()

    // Get exchange rate
    const { data: rate, error: rateError } = await supabase
      .from('currency_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .single()

    let conversionRate = null
    
    if (rate) {
      conversionRate = parseFloat(rate.rate)
    } else {
      // Try inverse rate
      const { data: inverseRate, error: inverseError } = await supabase
        .from('currency_rates')
        .select('rate')
        .eq('from_currency', toCurrency)
        .eq('to_currency', fromCurrency)
        .single()

      if (inverseRate) {
        conversionRate = 1 / parseFloat(inverseRate.rate)
      }
    }

    if (!conversionRate) {
      return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 })
    }

    const convertedAmount = Math.round(amount * conversionRate * 100) / 100

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount,
        fromCurrency,
        toCurrency,
        rate: conversionRate
      }
    })

  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
