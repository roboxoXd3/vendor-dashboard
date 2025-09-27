"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConversionRateByProduct({ filters = {} }) {
  // Generate sample conversion rate data
  const generateConversionData = () => {
    const products = [
      'Wireless Headphones',
      'Smart Watch',
      'Bluetooth Speaker',
      'Phone Case',
      'Power Bank',
      'Laptop Stand'
    ];

    return products.map(product => ({
      name: product.length > 12 ? product.substring(0, 12) + '...' : product,
      fullName: product,
      conversionRate: Math.floor(Math.random() * 15) + 5, // 5-20% conversion rate
      views: Math.floor(Math.random() * 200) + 50,
      sales: Math.floor(Math.random() * 30) + 5
    })).sort((a, b) => b.conversionRate - a.conversionRate);
  };

  const chartData = generateConversionData();

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
              domain={[0, 25]}
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
