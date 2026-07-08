"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useViewsOverTime } from '@/hooks/useVendor';

// Backed by Django's GET /api/vendors/analytics/views-over-time/?period=X.
// Two known caveats (see app/api/analytics/views-over-time/route.js): the
// data is always daily-bucketed (no weekly/monthly aggregation from Django
// yet), and it's sourced from a different table than the funnel/performance
// "Total Views" figure, so the numbers may not reconcile exactly.
export default function ProductViewsOverTime({ filters = {} }) {
  const { data: chartResult, isLoading, error } = useViewsOverTime(filters);
  const chartData = chartResult?.data || [];

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
        <h3 className="text-md font-semibold mb-4">Product Views Over Time</h3>
        <p className="text-red-600 text-sm">Error loading views data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-md font-semibold">Product Views Over Time</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 w-full flex items-center justify-center text-center text-gray-500 text-sm px-6">
          No view data for this period yet.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: '500' }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
