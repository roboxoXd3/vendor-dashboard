"use client";
import Image from "next/image";

const orders = [
  {
    id: "#ORD-5289",
    avatar: "/avatar.png",
    name: "Emma Watson",
    date: "May 28, 2023",
    price: "$182.94",
    status: "Delivered",
  },
  {
    id: "#ORD-5288",
    avatar: "/avatar.png",
    name: "David Miller",
    date: "May 27, 2023",
    price: "$89.50",
    status: "Shipped",
  },
  {
    id: "#ORD-5287",
    avatar: "/avatar.png",
    name: "Sophia Chen",
    date: "May 26, 2023",
    price: "$124.00",
    status: "Processing",
  },
  {
    id: "#ORD-5286",
    avatar: "/avatar.png",
    name: "Michael Brown",
    date: "May 25, 2023",
    price: "$65.75",
    status: "Delivered",
  },
];

const statusColor = {
  Delivered: "bg-green-100 text-green-600",
  Shipped: "bg-blue-100 text-blue-600",
  Processing: "bg-yellow-100 text-yellow-700",
};

export default function RecentOrders() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between mb-6">
        <h2 className="font-semibold">Recent Orders</h2>
        <a
          href="#"
          className="text-sm text-[var(--color-theme)] hover:underline"
        >
          View All Orders
        </a>
      </div>
      <div className="space-y-4">
        {orders.map((order, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-b-[#E5E7EB] pb-3"
          >
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    statusColor[order.status]
                  }`}
                >
                  {order.status}
                </span>
                <p className="text-sm font-semibold">{order.id}</p>
              </div>

              <div className="flex gap-2">
                <Image
                  src={order.avatar}
                  alt="Avatar"
                  width={25}
                  height={25}
                  className="rounded-full"
                />
                <p className="text-sm text-gray-500">{order.name}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p>{order.date}</p>
              <p className="font-medium">{order.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
