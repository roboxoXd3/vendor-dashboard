"use client";
import { useState } from "react";
import { FiEye, FiPrinter, FiMoreVertical } from "react-icons/fi";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

const statusStyles = {
  delivered: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  pending: "bg-purple-100 text-purple-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
  returned: "bg-orange-100 text-orange-700",
};

// Helper function to format status for display
const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to get customer name from shipping address
const getCustomerName = (order) => {
  return order.shipping_addresses?.name || 'Unknown Customer';
};

// Helper function to get first product name and image
const getFirstProduct = (order) => {
  const firstItem = order.order_items?.[0];
  if (!firstItem) return { name: 'No products', image: null, price: 0 };
  
  return {
    name: firstItem.products?.name || 'Unknown Product',
    image: firstItem.products?.images?.[0] || null,
    price: firstItem.price || 0,
    quantity: firstItem.quantity || 1
  };
};

// Helper function to calculate vendor total
const getVendorTotal = (order) => {
  return order.vendor_subtotal || order.total || 0;
};

export default function OrdersTable({
  orders,
  onSelectOrder,
  selectedOrderId,
}) {
  const [selectedId, setSelectedId] = useState(selectedOrderId || null);
  const { formatPrice } = useCurrencyContext();

  const handleSelect = (id) => {
    const newId = selectedId === id ? null : id;
    setSelectedId(newId);
    onSelectOrder(newId);
  };

  return (
    <div className="relative">
      {/* Desktop Table */}
      <div className="bg-white rounded-md shadow overflow-x-auto hidden md:block">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-gray-600 border-b-1 border-gray-200">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {orders.map((order) => {
              const customerName = getCustomerName(order);
              const firstProduct = getFirstProduct(order);
              const vendorTotal = getVendorTotal(order);
              const orderNumber = order.order_number || `#${order.id.slice(-8).toUpperCase()}`;
              
              return (
                <tr
                  key={order.id}
                  onClick={() => handleSelect(order.id)}
                  className={`border-b-1 border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedId === order.id ? "bg-green-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedId === order.id}
                      onChange={() => handleSelect(order.id)}
                      className="accent-[var(--color-theme)] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{orderNumber}</td>
                  <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    {customerName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {firstProduct.image ? (
                        <img
                          src={firstProduct.image}
                          alt={firstProduct.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">IMG</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{firstProduct.name}</div>
                        {order.order_items.length > 1 && (
                          <div className="text-xs text-gray-500">
                            +{order.order_items.length - 1} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(vendorTotal, 'USD')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        statusStyles[order.status] || statusStyles.pending
                      }`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-gray-500">
                      <FiEye className="cursor-pointer hover:text-black" />
                      <FiPrinter className="cursor-pointer hover:text-black" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-1">
        {orders.map((order) => {
          const customerName = getCustomerName(order);
          const firstProduct = getFirstProduct(order);
          const vendorTotal = getVendorTotal(order);
          const orderNumber = order.order_number || `#${order.id.slice(-8).toUpperCase()}`;
          
          return (
            <div
              key={order.id}
              onClick={() => handleSelect(order.id)}
              className={`bg-white p-4 rounded-md shadow flex flex-col space-y-3 cursor-pointer transition hover:shadow-md ${
                selectedId === order.id ? "ring-2 ring-green-500" : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">{orderNumber}</h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    statusStyles[order.status] || statusStyles.pending
                  }`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{customerName}</p>
                  <div className="flex items-center gap-2">
                    {firstProduct.image ? (
                      <img
                        src={firstProduct.image}
                        alt={firstProduct.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">IMG</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {firstProduct.name}
                      {order.order_items.length > 1 && ` +${order.order_items.length - 1} more`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  <strong>Amount:</strong> {formatPrice(vendorTotal, 'USD')}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(order.created_at)}
                </p>
              </div>

              <div className="flex justify-end gap-4 text-gray-500 pt-2 border-t border-gray-200">
                <FiEye className="cursor-pointer hover:text-black" />
                <FiPrinter className="cursor-pointer hover:text-black" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
