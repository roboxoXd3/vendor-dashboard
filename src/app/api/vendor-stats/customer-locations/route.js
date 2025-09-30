import { getSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    
    const vendorId = searchParams.get('vendorId');
    const period = searchParams.get('period') || '30d';

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Calculate date range based on period
    let dateRange;
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Query orders with shipping addresses
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        shipping_addresses!inner(
          city,
          state,
          country
        )
      `)
      .eq('vendor_id', vendorId)
      .gte('created_at', dateRange.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer locations:', error);
      return NextResponse.json({ error: 'Failed to fetch customer locations' }, { status: 500 });
    }

    // Process location data
    const locationCounts = {};
    let totalOrders = 0;

    orders.forEach(order => {
      if (order.shipping_addresses) {
        const address = order.shipping_addresses;
        let locationKey;
        
        // Create location key based on available data
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
      }
    });

    // Convert to array and calculate percentages
    const locations = Object.entries(locationCounts)
      .map(([location, orders_count]) => ({
        location,
        orders_count,
        percentage: totalOrders > 0 ? Math.round((orders_count / totalOrders) * 100) : 0
      }))
      .sort((a, b) => b.orders_count - a.orders_count)
      .slice(0, 10); // Top 10 locations

    return NextResponse.json({
      success: true,
      data: locations
    });

  } catch (error) {
    console.error('Customer locations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
