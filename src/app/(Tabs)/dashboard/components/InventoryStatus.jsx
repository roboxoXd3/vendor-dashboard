"use client";

export default function InventoryStatus() {
  return (
    <div className="bg-white p-4 pt-6 rounded-xl shadow-sm flex flex-col gap-4">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold">Inventory Status</h2>
        <a
          href="#"
          className="text-sm text-[var(--color-theme)] hover:underline"
        >
          Manage Inventory
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-gray-100 rounded-lg ">
          <p>In Stock</p>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="p-3 bg-gray-100  rounded-lg">
          <p>Low Stock</p>
          <p className="text-2xl font-bold">8</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-100  rounded-lg ">
          <p>Out Of Stock</p>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="p-3 bg-gray-100  rounded-lg">
          <p>Total Products</p>
          <p className="text-2xl font-bold">8</p>
        </div>
      </div>
    </div>
  );
}
