import { NextResponse } from 'next/server';
import { fetchAllVendorOrders } from '@/lib/besmart-orders-api';

// Note: Django's own customer-locations endpoint groups by unique customer
// (not order) and has no period filter — different semantics than what this
// dashboard widget expects, so this computes it directly from order data
// instead of proxying to that endpoint. See docs/BACKEND_ACTION_ITEMS.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    let dateRange;
    const now = new Date();
    switch (period) {
      case '7d':
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let orders;
    try {
      orders = await fetchAllVendorOrders();
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: err.status || 500 });
    }

    const locationCounts = {};
    let totalOrders = 0;

    orders
      .filter((order) => new Date(order.created_at) >= dateRange)
      .forEach((order) => {
        const address = order.shipping_address;
        if (!address) return;

        let locationKey;
        if (address.city && address.state) {
          locationKey = `${address.city}, ${address.state}`;
        } else if (address.city) {
          locationKey = address.city;
        } else if (address.state) {
          locationKey = address.state;
        } else if (address.country) {
          locationKey = address.country;
        } else {
          locationKey = 'Unknown Location';
        }

        locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
        totalOrders++;
      });

    const locations = Object.entries(locationCounts)
      .map(([location, orders_count]) => ({
        location,
        orders_count,
        percentage: totalOrders > 0 ? Math.round((orders_count / totalOrders) * 100) : 0
      }))
      .sort((a, b) => b.orders_count - a.orders_count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: locations
    });

  } catch (error) {
    console.error('Customer locations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
