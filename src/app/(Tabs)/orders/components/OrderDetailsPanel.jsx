"use client";
import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import Image from "next/image";
import { FaCheck, FaShuttleVan } from "react-icons/fa";
import { MdOutlineAccessTime } from "react-icons/md";
import { useUpdateOrderStatus } from "@/hooks/useOrders";

export default function OrderDetailsPanel({ selectedOrderId, orders = [], onClose }) {
  const [order, setOrder] = useState(null);
  const updateOrderStatus = useUpdateOrderStatus();

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

  // Helper functions
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerName = (order) => {
    return order.shipping_addresses?.name || 'Unknown Customer';
  };

  const getCustomerEmail = (order) => {
    // In a real app, you'd get this from a users table join
    return 'customer@example.com'; // Placeholder
  };

  const getCustomerPhone = (order) => {
    return order.shipping_addresses?.phone || 'No phone provided';
  };

  const getShippingAddress = (order) => {
    const addr = order.shipping_addresses;
    if (!addr) return 'No shipping address';
    
    return `${addr.address_line1}${addr.address_line2 ? ', ' + addr.address_line2 : ''}, ${addr.city}, ${addr.state} ${addr.zip}${addr.country ? ', ' + addr.country : ''}`;
  };

  const getVendorTotal = (order) => {
    return order.vendor_subtotal || order.total || 0;
  };

  useEffect(() => {
    const foundOrder = orders.find((o) => o.id === selectedOrderId);
    setOrder(foundOrder);
  }, [selectedOrderId, orders]);

  if (!order) return null;

  return (
    <div
      className={`
        fixed top-0 right-0 h-full z-50 bg-white shadow-lg overflow-y-auto transition-all duration-300 border-l border-gray-200 hide-scrollbar
        w-full sm:w-[400px]
      `}
    >
      {/* Header */}
      <div className="flex justify-between p-4 border-b border-gray-200">
        <h1 className="text-black text-md font-medium">Order Details</h1>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black text-xl"
        >
          <FiX />
        </button>
      </div>

      <div className="space-y-6 text-sm p-4">
        {/* Order ID & Status */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="text-xl font-semibold">
              {order.order_number || `#${order.id.slice(-8).toUpperCase()}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(order.created_at)}
            </p>
          </div>
          <p
            className={`px-3 py-1 text-sm rounded-2xl ${
              statusStyles[order.status] || statusStyles.pending
            }`}
          >
            {formatStatus(order.status)}
          </p>
        </div>

        {/* Customer Info */}
        <div>
          <h3 className="text-black text-md font-medium mb-4">
            Customer Information
          </h3>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium">
              {getCustomerName(order).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{getCustomerName(order)}</p>
              <p className="text-gray-600">{getCustomerEmail(order)}</p>
              <p className="text-gray-600">{getCustomerPhone(order)}</p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex flex-col sm:flex-row gap-5 pb-4 border-b border-gray-200">
          <div className="sm:w-1/2">
            <h3 className="font-medium text-md text-black pb-2">
              Shipping Address
            </h3>
            <p className="text-gray-500">{getShippingAddress(order)}</p>
          </div>
          <div className="sm:w-1/2">
            <h3 className="font-medium text-md text-black pb-2">
              Billing Address
            </h3>
            <p className="text-gray-500">{getShippingAddress(order)}</p>
          </div>
        </div>

        {/* Product Info */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-black text-md font-medium mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.order_items?.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                {item.products?.images?.[0] ? (
                  <img
                    src={item.products.images[0]}
                    alt="Product Image"
                    className="w-14 h-14 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">IMG</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-black text-lg font-medium">
                    {item.products?.name || 'Unknown Product'}
                  </p>
                  <p className="text-gray-600">SKU: {item.products?.sku || 'N/A'}</p>
                  {item.selected_size && (
                    <p className="text-gray-600">Size: {item.selected_size}</p>
                  )}
                  {item.selected_color && (
                    <p className="text-gray-600">Color: {item.selected_color}</p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-gray-600">
                      {item.quantity} x ${item.price?.toFixed(2)}
                    </p>
                    <p className="text-black text-lg font-medium">
                      ${(item.price * item.quantity)?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="font-medium text-md text-black mb-3">
            Payment Information
          </h3>
          <div className="space-y-2 text-gray-600">
            <div className="flex justify-between">
              <p>Vendor Subtotal</p>
              <p>${getVendorTotal(order).toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping</p>
              <p>${order.shipping_fee?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="flex justify-between pt-2 text-black text-lg font-medium border-t border-gray-200">
              <p>Vendor Total</p>
              <p>${getVendorTotal(order).toFixed(2)}</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Payment Method: {order.shipping_method || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="font-medium text-md text-black mb-3">
            Order Status
          </h3>
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <div className="p-3 text-lg rounded-full bg-green-100 text-green-700">
                <FaCheck />
              </div>
              <div>
                <p className="font-medium">Order Placed</p>
                <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
              </div>
            </div>
            
            {order.status !== 'pending' && (
              <div className="flex gap-4 items-center">
                <div className={`p-3 text-lg rounded-full ${
                  ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) ? (
                    <FaCheck />
                  ) : (
                    <MdOutlineAccessTime />
                  )}
                </div>
                <div>
                  <p className="font-medium">{formatStatus(order.status)}</p>
                  <p className="text-xs text-gray-500">
                    {order.updated_at ? formatDate(order.updated_at) : 'Status updated'}
                  </p>
                </div>
              </div>
            )}

            {order.tracking_number && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Tracking Number</p>
                <p className="text-blue-700">{order.tracking_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <select
            onChange={(e) => {
              if (e.target.value && e.target.value !== order.status) {
                updateOrderStatus.mutate({
                  orderId: order.id,
                  status: e.target.value
                });
              }
            }}
            className="border border-gray-300 px-4 py-3 text-black text-md rounded-lg w-full"
            defaultValue={order.status}
          >
            <option value="">Update Order Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {order.status === 'shipped' && (
            <button className="bg-[var(--color-theme)] px-4 py-3 text-white text-md rounded-lg w-full">
              Generate Shipping Label
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

