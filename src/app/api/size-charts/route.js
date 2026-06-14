import { NextResponse } from 'next/server'
import { besmartRequest, parseBesmartError } from '@/lib/besmart-api'
import { buildBesmartSizeChartPayload, transformBesmartSizeChart } from '@/lib/size-chart-api'

export async function GET() {
  try {
    const { response, error, status } = await besmartRequest('/api/vendors/size-charts/', {
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

    const sizeCharts = (data.results || []).map((chart) => transformBesmartSizeChart(chart))

    return NextResponse.json({
      success: true,
      sizeCharts,
      count: data.count ?? sizeCharts.length,
    })
  } catch (error) {
    console.error('Error in size charts list API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, vendor_id: _vendorId, image_url: _imageUrl, ...rest } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const payload = buildBesmartSizeChartPayload({ name, ...rest }, { includeImage: false })

    const { response, error, status } = await besmartRequest('/api/vendors/size-charts/', {
      method: 'POST',
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
      message: 'Size chart created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error in create size chart API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
