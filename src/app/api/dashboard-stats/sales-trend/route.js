import { getSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    
    const vendorId = searchParams.get('vendorId');
    const period = searchParams.get('period') || '30d';
    const view = searchParams.get('view') || 'daily';

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

    // Query sales data based on view type
    let query;
    
    if (view === 'daily') {
      query = supabase
        .from('orders')
        .select(`
          created_at,
          total
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', dateRange.toISOString())
        .order('created_at', { ascending: true });
    } else if (view === 'weekly') {
      // For weekly view, we'll group by week
      query = supabase
        .from('orders')
        .select(`
          created_at,
          total
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', dateRange.toISOString())
        .order('created_at', { ascending: true });
    } else {
      // Monthly view
      query = supabase
        .from('orders')
        .select(`
          created_at,
          total
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', dateRange.toISOString())
        .order('created_at', { ascending: true });
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching sales trend data:', error);
      return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
    }

    // Process data based on view type
    let processedData = [];
    
    if (view === 'daily') {
      // Group by day
      const dailyData = {};
      
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            daily_sales: 0,
            orders_count: 0
          };
        }
        
        dailyData[dateKey].daily_sales += parseFloat(order.total);
        dailyData[dateKey].orders_count += 1;
      });
      
      processedData = Object.values(dailyData);
    } else if (view === 'weekly') {
      // Group by week
      const weeklyData = {};
      
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            date: weekKey,
            daily_sales: 0,
            orders_count: 0
          };
        }
        
        weeklyData[weekKey].daily_sales += parseFloat(order.total);
        weeklyData[weekKey].orders_count += 1;
      });
      
      processedData = Object.values(weeklyData);
    } else {
      // Group by month
      const monthlyData = {};
      
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: monthKey,
            daily_sales: 0,
            orders_count: 0
          };
        }
        
        monthlyData[monthKey].daily_sales += parseFloat(order.total);
        monthlyData[monthKey].orders_count += 1;
      });
      
      processedData = Object.values(monthlyData);
    }

    // Sort by date
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
