"use client";

import { useInventoryStatus } from '@/hooks/useVendor';

export default function InventoryStatus() {
  const { data: inventoryData, isLoading, error } = useInventoryStatus();

  if (isLoading) {
    return (
      <div className="bg-white p-4 pt-6 rounded-xl shadow-sm flex flex-col gap-4">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Inventory Status</h2>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
            <p>In Stock</p>
            <div className="h-8 bg-gray-200 rounded w-12 mt-1"></div>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
            <p>Low Stock</p>
            <div className="h-8 bg-gray-200 rounded w-12 mt-1"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
            <p>Out Of Stock</p>
            <div className="h-8 bg-gray-200 rounded w-12 mt-1"></div>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
            <p>Total Products</p>
            <div className="h-8 bg-gray-200 rounded w-12 mt-1"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 pt-6 rounded-xl shadow-sm flex flex-col gap-4">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Inventory Status</h2>
          <a
            href="/products"
            className="text-sm text-[var(--color-theme)] hover:underline"
          >
            Manage Inventory
          </a>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Error loading inventory data</p>
        </div>
      </div>
    );
  }

  const inventory = inventoryData?.data || {};

  return (
    <div className="bg-white p-4 pt-6 rounded-xl shadow-sm flex flex-col gap-4">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold">Inventory Status</h2>
        <a
          href="/products"
          className="text-sm text-[var(--color-theme)] hover:underline"
        >
          Manage Inventory
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-gray-100 rounded-lg ">
          <p>In Stock</p>
          <p className="text-2xl font-bold">{inventory.inStock || 0}</p>
        </div>
        <div className="p-3 bg-gray-100  rounded-lg">
          <p>Low Stock</p>
          <p className="text-2xl font-bold">{inventory.lowStock || 0}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-100  rounded-lg ">
          <p>Out Of Stock</p>
          <p className="text-2xl font-bold">{inventory.outOfStock || 0}</p>
        </div>
        <div className="p-3 bg-gray-100  rounded-lg">
          <p>Total Products</p>
          <p className="text-2xl font-bold">{inventory.totalProducts || 0}</p>
        </div>
      </div>
    </div>
  );
}
