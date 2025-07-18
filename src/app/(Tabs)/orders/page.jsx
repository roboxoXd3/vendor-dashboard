"use client";

import { useState } from "react";
import OrdersTable from "./components/OrdersTable";
import OrderDetailsPanel from "./components/OrderDetailsPanel";
import OrdersPageFilterBar from "./components/OrderPageFilterBar";
import OrdersFilterBar from "./components/OrdersFilterBar";
import sampleOrders from "./data/orders.json";

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeStatus, setActiveStatus] = useState("All Orders");

  const filteredOrders =
    activeStatus === "All Orders"
      ? sampleOrders
      : sampleOrders.filter(
          (order) => order.status.toLowerCase() === activeStatus.toLowerCase()
        );

  return (
    <div className="grid gap-4 p-4">
      {/* Filter Bar for date, export etc */}
      <OrdersPageFilterBar />

      {/* Order Status Filter Bar (All, Delivered, etc) */}
      <OrdersFilterBar
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        orders={sampleOrders}
      />

      {/* Orders Table */}
      <div className="overflow-x-auto md:bg-white md:rounded-lg md:shadow-sm">
        <OrdersTable
          orders={filteredOrders}
          onSelectOrder={setSelectedOrderId}
          selectedOrderId={selectedOrderId}
        />
      </div>

      {/* Order Details Panel (Shows on selection) */}
      {selectedOrderId && (
        <OrderDetailsPanel
          selectedOrderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
