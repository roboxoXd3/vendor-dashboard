"use client";
import { useState } from "react";
import { FiEye, FiPrinter, FiMoreVertical } from "react-icons/fi";

const statusStyles = {
  Delivered: "bg-green-100 text-green-700",
  Shipped: "bg-blue-100 text-blue-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Pending: "bg-purple-100 text-purple-700",
};

export default function OrdersTable({
  orders,
  onSelectOrder,
  selectedOrderId,
}) {
  const [selectedId, setSelectedId] = useState(selectedOrderId || null);

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
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => handleSelect(order.id)}
                className={`border-b-1 border-gray-200 cursor-pointer ${
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
                <td className="px-4 py-3 font-medium">{order.id}</td>
                <td className="px-4 py-3">{order.date}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <img
                    src={order.userAvatar}
                    alt={order.customer}
                    className="w-7 h-7 rounded-full"
                  />
                  {order.customer}
                </td>
                <td className="px-4 py-3">{order.product.name}</td>
                <td className="px-4 py-3 font-semibold">
                  ${order.product.price.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-gray-500">
                    <FiEye className="cursor-pointer hover:text-black" />
                    <FiPrinter className="cursor-pointer hover:text-black" />
                    <FiMoreVertical className="cursor-pointer hover:text-black" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-1">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => handleSelect(order.id)}
            className={`bg-white p-4 rounded-md shadow flex flex-col space-y-3 cursor-pointer transition`}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">#{order.id}</h3>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statusStyles[order.status]
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={order.userAvatar}
                alt={order.customer}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">{order.customer}</p>
                <p className="text-xs text-gray-500">{order.product.name}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Amount:</strong> ${order.product.price.toFixed(2)}
              </p>
              <p>
                <strong>Date:</strong> {order.date}
              </p>
            </div>

            <div className="flex justify-end gap-4 text-gray-500 pt-2 border-t border-gray-200">
              <FiEye className="cursor-pointer hover:text-black" />
              <FiPrinter className="cursor-pointer hover:text-black" />
              <FiMoreVertical className="cursor-pointer hover:text-black" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
