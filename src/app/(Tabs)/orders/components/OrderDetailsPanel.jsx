"use client";
import { useEffect, useState } from "react";
import detailedOrders from "../data/orders.json";
import { FiX } from "react-icons/fi";
import Image from "next/image";
import { FaCheck, FaShuttleVan } from "react-icons/fa";
import { MdOutlineAccessTime } from "react-icons/md";

export default function OrderDetailsPanel({ selectedOrderId, onClose }) {
  const [order, setOrder] = useState(null);

  const statusStyles = {
    Delivered: "bg-green-100 text-green-700",
    Shipped: "bg-blue-100 text-blue-700",
    Processing: "bg-yellow-100 text-yellow-700",
    Pending: "bg-purple-100 text-purple-700",
  };

  useEffect(() => {
    const foundOrder = detailedOrders.find((o) => o.id === selectedOrderId);
    setOrder(foundOrder);
  }, [selectedOrderId]);

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
            <p className="text-xl font-semibold">{order.id}</p>
          </div>
          <p
            className={`px-3 py-1 text-sm rounded-2xl ${
              statusStyles[order.status]
            }`}
          >
            {order.status}
          </p>
        </div>

        {/* Customer Info */}
        <div>
          <h3 className="text-black text-md font-medium mb-4">
            Customer Information
          </h3>
          <div className="flex gap-4 items-center">
            <Image
              src={order.userAvatar}
              alt="User Avatar"
              className="rounded-full"
              width={50}
              height={50}
            />
            <div>
              <p className="font-medium">{order.customer}</p>
              <p className="text-gray-600">{order.email}</p>
              <p className="text-gray-600">{order.phone}</p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex flex-col sm:flex-row gap-5 pb-4 border-b border-gray-200">
          <div className="sm:w-1/2">
            <h3 className="font-medium text-md text-black pb-2">
              Shipping Address
            </h3>
            <p className="text-gray-500">{order.shipping}</p>
          </div>
          <div className="sm:w-1/2">
            <h3 className="font-medium text-md text-black pb-2">
              Billing Address
            </h3>
            <p className="text-gray-500">{order.billing}</p>
          </div>
        </div>

        {/* Product Info */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-black text-md font-medium mb-4">Order Items</h3>
          <div className="flex gap-4 items-center">
            <Image
              src={order.product.image}
              alt="Product Image"
              width={55}
              height={50}
              className="rounded-md"
            />
            <div className="flex-1">
              <p className="text-black text-lg font-medium">
                {order.product.name}
              </p>
              <p className="text-gray-600">SKU: {order.product.sku}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-600">
                  {order.product.qty} x ${order.product.price}
                </p>
                <p className="text-black text-lg">${order.product.price}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="font-medium text-md text-black mb-3">
            Payment Information
          </h3>
          <div className="space-y-2 text-gray-600">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>${order.subtotal}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping</p>
              <p>${order.shippingCost}</p>
            </div>
            <div className="flex justify-between pb-2 border-b border-gray-200">
              <p>Tax</p>
              <p>${order.tax}</p>
            </div>
            <div className="flex justify-between pt-2 text-black text-lg font-medium">
              <p>Total</p>
              <p>${order.total}</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Paid with card ending in {order.card}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="font-medium text-md text-black mb-3">
            Order Timeline
          </h3>
          <div className="space-y-3">
            {order.timeline.map((step, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div
                  className={`p-3 text-lg rounded-full ${
                    step.status === "done"
                      ? "bg-green-100 text-green-700"
                      : step.status === "current"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {step.status === "done" ? (
                    <FaCheck />
                  ) : step.status === "current" ? (
                    <MdOutlineAccessTime />
                  ) : (
                    <FaShuttleVan />
                  )}
                </div>
                <div>
                  <p className="font-medium">{step.label}</p>
                  {step.time && (
                    <p className="text-xs text-gray-500">{step.time}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button className="bg-[var(--color-theme)] px-4 py-3 text-white text-md rounded-lg w-full">
            Generate Shipping Label
          </button>
          <button className="border-2 border-gray-300 px-4 py-3 text-black text-md rounded-lg w-full">
            Update Order Status
          </button>
        </div>
      </div>
    </div>
  );
}
