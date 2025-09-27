"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductViewsOverTime({ filters = {} }) {
  const [activeView, setActiveView] = useState("daily");

  // Generate sample time series data based on the period
  const generateTimeSeriesData = () => {
    const data = [];
    const now = new Date();
    let days = 30;
    
    if (filters.period === '7d') days = 7;
    else if (filters.period === '90d') days = 90;
    else if (filters.period === '1y') days = 365;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      let views = Math.floor(Math.random() * 50) + 20; // Random views between 20-70
      if (i < 7) views += Math.floor(Math.random() * 30); // Recent days have more views
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        views: views,
        fullDate: date.toISOString().split('T')[0]
      });
    }
    
    return data;
  };

  const chartData = generateTimeSeriesData();

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-md font-semibold">Product Views Over Time</h3>
        <div className="flex gap-2 flex-wrap">
          {["daily", "weekly", "monthly"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 rounded cursor-pointer text-xs ${
                activeView === view
                  ? "text-white bg-[var(--color-theme)]"
                  : "text-gray-500 bg-gray-100"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
