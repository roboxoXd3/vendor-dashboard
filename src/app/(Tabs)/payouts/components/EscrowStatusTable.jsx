"use client";

import { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";

export default function EscrowStatusTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEscrowOrders();
  }, [statusFilter]);

  const fetchEscrowOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/escrow' 
        : `/api/escrow?status=${statusFilter}`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch escrow orders');
      }

      setOrders(result.data);
    } catch (err) {
      console.error('Error fetching escrow orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Escrow Status</h2>
          <div className="flex gap-2 items-center">
            <label className="text-gray-500 text-sm">View:</label>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Escrow Status</h2>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <p className="font-medium">Error loading escrow orders</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchEscrowOrders}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 w-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-gray-700">Escrow Status</h2>
        <div className="flex gap-2 items-center">
          <label className="text-gray-500 text-sm">View:</label>
          <select 
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="text-sm border border-gray-300 bg-gray-100 rounded px-2 py-1 outline-0 focus:outline-none focus:ring-0"
          >
            <option value="all">All Orders</option>
            <option value="held">Held in Escrow</option>
            <option value="pending">Processing</option>
            <option value="released">Released</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-3">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm">No escrow orders found</p>
          <p className="text-xs text-gray-400 mt-1">
            Orders with payments will appear here when held in escrow
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-[600px] w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Release Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#E5E7EB]">
                    <td className="p-3 text-md">#{order.id.slice(0, 8)}</td>
                    <td className="p-3 flex items-center gap-2 text-md whitespace-nowrap">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="text-gray-500 text-xs" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customer}</span>
                        {order.customerEmail && (
                          <span className="text-xs text-gray-500">{order.customerEmail}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-md font-medium">${order.amount}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${order.statusClass}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{order.releaseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-[#E5E7EB] rounded-lg p-4 shadow-sm bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold">#{order.id.slice(0, 8)}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${order.statusClass}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="text-gray-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-md font-medium">{order.customer}</p>
                    <p className="text-sm text-gray-700">
                      <strong className="text-black">Amount:</strong> $
                      {order.amount}
                    </p>
                    {order.customerEmail && (
                      <p className="text-xs text-gray-500">{order.customerEmail}</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700">Release Date: {order.releaseDate}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
