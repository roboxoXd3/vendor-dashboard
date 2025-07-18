const statuses = [
  "All Orders",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
];

export default function OrdersFilterBar({
  activeStatus,
  setActiveStatus,
  orders,
}) {
  const countByStatus = (status) => {
    if (status === "All Orders") return orders.length;
    return orders.filter((o) => o.status.toLowerCase() === status.toLowerCase())
      .length;
  };

  return (
    <div className="flex flex-wrap gap-2 bg-white shadow-md mb-2 border border-gray-200 rounded-md px-4 py-2 overflow-x-auto">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => setActiveStatus(status)}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md transition cursor-pointer ${
            activeStatus === status
              ? "bg-[var(--color-theme-light)] text-[var(--color-theme)] font-semibold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {status}
          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {countByStatus(status)}
          </span>
        </button>
      ))}
    </div>
  );
}
