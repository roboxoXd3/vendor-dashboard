const statuses = [
  "All Orders",
  "Pending", 
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function OrdersFilterBar({
  activeStatus,
  setActiveStatus,
  orders = [],
  statusCounts = {},
  isLoading = false,
}) {
  const getStatusCount = (status) => {
    if (status === "All Orders") return statusCounts.all || 0;
    return statusCounts[status.toLowerCase()] || 0;
  };

  return (
    <div className="flex flex-wrap gap-2 bg-white shadow-md mb-2 border border-gray-200 rounded-md px-4 py-2 overflow-x-auto">
      {statuses.map((status) => {
        const count = getStatusCount(status);
        const isActive = activeStatus === status;
        
        return (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            disabled={isLoading}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md transition cursor-pointer disabled:opacity-50 ${
              isActive
                ? "bg-[var(--color-theme-light)] text-[var(--color-theme)] font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {status}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isActive 
                ? "bg-[var(--color-theme)] text-white" 
                : "bg-gray-100 text-gray-700"
            }`}>
              {isLoading ? "..." : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
