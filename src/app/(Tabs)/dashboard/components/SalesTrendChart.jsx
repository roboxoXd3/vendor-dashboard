"use client";

import { useState, useEffect } from 'react';
import { useSalesTrendData } from '@/hooks/useSalesTrendData';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SalesTrendChart({ filters = {} }) {
  const { data: salesData, isLoading, error } = useSalesTrendData(filters);
  const { formatPrice } = useCurrencyContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white min-h-[160px] sm:min-h-[200px] md:min-h-[240px] rounded-xl shadow-sm p-3 sm:p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-xs sm:text-sm">Loading sales trend...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-[160px] sm:min-h-[200px] md:min-h-[240px] rounded-xl shadow-sm p-3 sm:p-4 flex items-center justify-center">
        <div className="text-red-500 text-xs sm:text-sm">Error loading sales data</div>
      </div>
    );
  }

  const sales = salesData?.data || [];

  // Prepare chart data
  const chartData = {
    labels: sales.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }).reverse(), // Show oldest to newest
    datasets: [
      {
        label: 'Daily Sales',
        data: sales.map(item => parseFloat(item.daily_sales)).reverse(),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Orders Count',
        data: sales.map(item => item.orders_count).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: isMobile ? 10 : 20
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: isMobile ? 8 : 20,
          font: {
            size: isMobile ? 9 : 12
          },
          boxWidth: isMobile ? 8 : 12,
          boxHeight: isMobile ? 8 : 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: isMobile ? 4 : 8,
        titleFont: {
          size: isMobile ? 10 : 13
        },
        bodyFont: {
          size: isMobile ? 9 : 12
        },
        padding: isMobile ? 8 : 12,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Sales: ${formatPrice(context.parsed.y, 'USD', { showSymbol: true, decimals: 2 })}`;
            } else {
              return `Orders: ${context.parsed.y}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: isMobile ? 8 : 12
          },
          maxTicksLimit: isMobile ? 4 : 10,
          padding: isMobile ? 4 : 8
        },
        title: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: isMobile ? 8 : 12
          },
          callback: function(value) {
            if (isMobile) {
              // Shorter format for mobile
              return value >= 1000 ? `${(value/1000).toFixed(0)}k` : value.toString();
            }
            return formatPrice(value, 'USD', { showSymbol: true, decimals: 0 });
          },
          maxTicksLimit: isMobile ? 3 : 6,
          padding: isMobile ? 4 : 8
        },
        title: {
          display: false
        }
      },
      y1: {
        type: 'linear',
        display: !isMobile, // Hide secondary axis on mobile
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          maxTicksLimit: 6
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#fff',
        radius: isMobile ? 2 : 4,
        hoverRadius: isMobile ? 3 : 6,
        borderWidth: isMobile ? 1 : 2
      },
      line: {
        borderWidth: isMobile ? 1 : 2,
        tension: 0.4
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6">
      <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-6">
        <div>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900">Sales Trend</h2>
          <p className="text-xs sm:text-sm text-gray-500">Daily sales and orders over time</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mr-1 sm:mr-2"></div>
            <span className="text-gray-600">Sales</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1 sm:mr-2"></div>
            <span className="text-gray-600">Orders</span>
          </div>
        </div>
      </div>
      
      <div className="h-40 sm:h-64 md:h-80 w-full overflow-hidden">
        {sales.length > 0 ? (
          <div className="w-full h-full">
            <Line data={chartData} options={options} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center px-2 sm:px-4">
              <div className="text-xl sm:text-4xl mb-1 sm:mb-2">📊</div>
              <p className="text-xs sm:text-base">No sales data available</p>
              <p className="text-xs sm:text-sm">Sales will appear here once you start receiving orders</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
