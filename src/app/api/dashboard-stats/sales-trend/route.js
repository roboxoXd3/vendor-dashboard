import { NextResponse } from 'next/server';
import { besmartRequest, parseBesmartError } from '@/lib/besmart-api';

// GET /api/dashboard-stats/sales-trend
//
// Django's sales endpoint only returns daily granularity ({date, revenue,
// orders}) — no weekly/monthly aggregation option. We re-bucket it here to
// preserve the `view` param and the {date, daily_sales, orders_count} shape
// the sales trend chart expects.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const view = searchParams.get('view') || 'daily';

    const { response, error, status } = await besmartRequest(`/api/vendors/dashboard/sales-trend/?period=${period}`);
    if (error) {
      return NextResponse.json({ error }, { status });
    }
    if (!response.ok) {
      const message = await parseBesmartError(response);
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const { dailySales } = await response.json();
    const daily = (dailySales || []).map((d) => ({
      date: d.date,
      daily_sales: d.revenue,
      orders_count: d.orders,
    }));

    let processedData;
    if (view === 'weekly') {
      const buckets = {};
      daily.forEach((d) => {
        const date = new Date(d.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];
        if (!buckets[key]) buckets[key] = { date: key, daily_sales: 0, orders_count: 0 };
        buckets[key].daily_sales += d.daily_sales;
        buckets[key].orders_count += d.orders_count;
      });
      processedData = Object.values(buckets);
    } else if (view === 'monthly') {
      const buckets = {};
      daily.forEach((d) => {
        const date = new Date(d.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!buckets[key]) buckets[key] = { date: key, daily_sales: 0, orders_count: 0 };
        buckets[key].daily_sales += d.daily_sales;
        buckets[key].orders_count += d.orders_count;
      });
      processedData = Object.values(buckets);
    } else {
      processedData = daily;
    }

    processedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json({
      success: true,
      data: processedData
    });

  } catch (error) {
    console.error('Sales trend API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
