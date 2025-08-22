"use client";

import { useState } from "react";
import OrdersTable from "./components/OrdersTable";
import OrderDetailsPanel from "./components/OrderDetailsPanel";
import OrdersPageFilterBar from "./components/OrderPageFilterBar";
import OrdersFilterBar from "./components/OrdersFilterBar";
import { useVendorOrders, useOrderStatusCounts } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeStatus, setActiveStatus] = useState("All Orders");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  
  const { vendor, isApprovedVendor } = useAuth();

  // Fetch orders with current filters
  const { 
    data: ordersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useVendorOrders({
    status: activeStatus,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    page: currentPage,
    limit: 20
  });

  const orders = ordersResponse?.data || [];
  const statusCounts = useOrderStatusCounts(orders);

  // Filter orders by status for display
  const filteredOrders = activeStatus === "All Orders" 
    ? orders 
    : orders.filter(order => 
        order.status.toLowerCase() === activeStatus.toLowerCase()
      );

  // Handle loading and error states
  if (!isApprovedVendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Vendor Approval Required
          </h3>
          <p className="text-gray-600">
            Your vendor account needs to be approved to view orders.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">
            Error Loading Orders
          </h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4">
      {/* Filter Bar for date, export etc */}
      <OrdersPageFilterBar 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        isLoading={isLoading}
        onRefresh={() => refetch()}
      />

      {/* Order Status Filter Bar (All, Delivered, etc) */}
      <OrdersFilterBar
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        orders={orders}
        statusCounts={statusCounts}
        isLoading={isLoading}
      />

      {/* Orders Table */}
      <div className="overflow-x-auto md:bg-white md:rounded-lg md:shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Orders Found
              </h3>
              <p className="text-gray-600">
                {activeStatus === "All Orders" 
                  ? "You haven't received any orders yet."
                  : `No orders with status "${activeStatus}" found.`
                }
              </p>
            </div>
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onSelectOrder={setSelectedOrderId}
            selectedOrderId={selectedOrderId}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Pagination */}
      {ordersResponse?.pagination && ordersResponse.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(ordersResponse.pagination.totalPages, currentPage + 1))}
              disabled={currentPage >= ordersResponse.pagination.totalPages}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((currentPage - 1) * 20) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 20, ordersResponse.pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{ordersResponse.pagination.total}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} of {ordersResponse.pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(ordersResponse.pagination.totalPages, currentPage + 1))}
                  disabled={currentPage >= ordersResponse.pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Panel (Shows on selection) */}
      {selectedOrderId && (
        <OrderDetailsPanel
          selectedOrderId={selectedOrderId}
          orders={orders}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
