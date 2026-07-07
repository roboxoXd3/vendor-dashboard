"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProductPerformance } from '@/hooks/useVendor';

// Was previously a Math.random() fake-data generator with hardcoded generic
// product names unrelated to the vendor's actual catalog. Now sourced from
// the same real per-product performance data as the ProductsPerformance
// table below it (Django-backed, via useProductPerformance).
export default function ConversionRateByProduct({ filters = {} }) {
  const { data: productsData, isLoading, error } = useProductPerformance(filters);
  const products = Array.isArray(productsData?.data) ? productsData.data : [];

  const chartData = products
    .slice()
    .sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0))
    .slice(0, 6)
    .map((p) => ({
      name: p.name?.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      fullName: p.name,
      conversionRate: p.conversionRate || 0,
      views: p.views || 0,
      sales: p.ordersCount || 0,
    }));

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 h-full animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6 h-full">
        <h3 className="text-md font-semibold mb-4">Conversion Rate by Product</h3>
        <p className="text-red-600 text-sm">Error loading conversion data</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6 h-full">
        <h3 className="text-md font-semibold mb-4">Conversion Rate by Product</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
          No product performance data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-md font-semibold">Conversion Rate by Product</h3>
        <button className="cursor-pointer text-sm text-[var(--color-theme)]">
          View All
        </button>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              stroke="#666"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#374151', fontWeight: '500' }}
              formatter={(value, name) => [
                `${value}%`,
                'Conversion Rate'
              ]}
              labelFormatter={(label) => `Product: ${label}`}
            />
            <Bar
              dataKey="conversionRate"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
