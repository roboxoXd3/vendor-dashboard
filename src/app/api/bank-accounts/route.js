import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// GET /api/bank-accounts - Fetch vendor bank accounts
export async function GET() {
  try {
    const { response, error, status } = await besmartRequest('/api/vendors/bank-accounts/')

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const data = await response.json()

    return Response.json({
      success: true,
      data: data.results || data || []
    })

  } catch (error) {
    console.error('❌ Bank accounts API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/bank-accounts - Add new bank account
export async function POST(request) {
  try {
    const body = await request.json()
    const { bank_code, account_number, account_name, bank_name } = body

    if (!bank_code || !account_number || !account_name || !bank_name) {
      return Response.json({
        error: 'Bank code, account number, account name, and bank name are required'
      }, { status: 400 })
    }

    const existing = await besmartRequest('/api/vendors/bank-accounts/')
    if (existing.error) {
      return Response.json({ error: existing.error }, { status: existing.status })
    }
    const existingData = existing.response.ok ? await existing.response.json() : { results: [] }
    const existingAccounts = existingData.results || existingData || []
    const isFirstAccount = existingAccounts.length === 0

    // If this becomes the default, unset default on all other accounts first
    // (Django's bank-accounts endpoint is plain CRUD — it doesn't enforce
    // "only one default" itself).
    if (isFirstAccount || body.is_default) {
      await Promise.all(
        existingAccounts
          .filter((acc) => acc.is_default)
          .map((acc) =>
            besmartRequest(`/api/vendors/bank-accounts/${acc.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_default: false }),
            })
          )
      )
    }

    const { response, error, status } = await besmartRequest('/api/vendors/bank-accounts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bank_code,
        account_number,
        account_name,
        bank_name,
        is_verified: false,
        is_default: isFirstAccount || body.is_default || false,
      }),
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    const newBankAccount = await response.json()

    return Response.json({
      success: true,
      message: 'Bank account added successfully. It will be verified by admin.',
      data: newBankAccount
    })

  } catch (error) {
    console.error('❌ Add bank account API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
