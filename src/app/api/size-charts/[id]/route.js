import { NextResponse } from 'next/server'
import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { buildBesmartSizeChartPayload, transformBesmartSizeChart } from '@/lib/size-chart-api'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const { response, error, status } = await besmartRequest(`/api/vendors/size-charts/${id}/`, {
      method: 'GET',
    })

    if (error) {
      return NextResponse.json({ success: false, error }, { status })
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: await parseBesmartError(response) },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      sizeChart: transformBesmartSizeChart(data),
    })
  } catch (error) {
    console.error('Error in get size chart API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { image_url: _imageUrl, vendor_id: _vendorId, ...rest } = body

    if (!rest.name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const payload = buildBesmartSizeChartPayload(rest, { includeImage: false })

    const { response, error, status } = await besmartRequest(`/api/vendors/size-charts/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (error) {
      return NextResponse.json({ success: false, error }, { status })
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: await parseBesmartError(response) },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      sizeChart: transformBesmartSizeChart(data),
      message: 'Size chart updated successfully',
    })
  } catch (error) {
    console.error('Error in update size chart API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { response, error, status } = await besmartRequest(`/api/vendors/size-charts/${id}/`, {
      method: 'DELETE',
    })

    if (error) {
      return NextResponse.json({ success: false, error }, { status })
    }

    if (!response.ok && response.status !== 204) {
      return NextResponse.json(
        { success: false, error: await parseBesmartError(response) },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Size chart deleted successfully',
    })
  } catch (error) {
    console.error('Error in delete size chart API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
