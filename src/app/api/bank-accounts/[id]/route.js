import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'

// PUT /api/bank-accounts/[id] - Update bank account (make default)
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()

    // If making this the default, unset default on all other accounts first
    // (Django's bank-accounts endpoint is plain CRUD — it doesn't enforce
    // "only one default" itself).
    if (body.is_default) {
      const existing = await besmartRequest('/api/vendors/bank-accounts/')
      if (!existing.error && existing.response.ok) {
        const existingData = await existing.response.json()
        const accounts = existingData.results || existingData || []
        await Promise.all(
          accounts
            .filter((acc) => acc.is_default && acc.id !== id)
            .map((acc) =>
              besmartRequest(`/api/vendors/bank-accounts/${acc.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_default: false }),
              })
            )
        )
      }
    }

    const { response, error, status } = await besmartRequest(`/api/vendors/bank-accounts/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: body.is_default || false }),
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json(
        { error: response.status === 404 ? 'Bank account not found' : message },
        { status: response.status }
      )
    }

    const updatedBankAccount = await response.json()

    return Response.json({
      success: true,
      message: 'Bank account updated successfully',
      data: updatedBankAccount
    })

  } catch (error) {
    console.error('❌ Update bank account API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/bank-accounts/[id] - Delete bank account
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const existing = await besmartRequest(`/api/vendors/bank-accounts/${id}/`)
    if (existing.error) {
      return Response.json({ error: existing.error }, { status: existing.status })
    }
    if (!existing.response.ok) {
      const message = await parseBesmartError(existing.response)
      return Response.json(
        { error: existing.response.status === 404 ? 'Bank account not found' : message },
        { status: existing.response.status }
      )
    }
    const bankAccount = await existing.response.json()

    if (bankAccount.is_default) {
      return Response.json({
        error: 'Cannot delete default bank account. Please set another account as default first.'
      }, { status: 400 })
    }

    const { response, error, status } = await besmartRequest(`/api/vendors/bank-accounts/${id}/`, {
      method: 'DELETE',
    })

    if (error) {
      return Response.json({ error }, { status })
    }
    if (!response.ok) {
      const message = await parseBesmartError(response)
      return Response.json({ error: message }, { status: response.status })
    }

    return Response.json({
      success: true,
      message: 'Bank account deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete bank account API error:', error)
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
