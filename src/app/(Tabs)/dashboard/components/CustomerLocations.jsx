"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRecentOrders } from '@/hooks/useVendor';

export default function CustomerLocations() {
  const { data: ordersData, isLoading } = useRecentOrders(50); // Get more orders to analyze locations

  // For now, we'll show a placeholder since we don't have customer address data in orders
  // In a real implementation, you'd need to join orders with shipping_addresses table
  const locations = [
    { name: "Data Available Soon", percent: 0 },
  ];

  if (isLoading) {
    return (
      <Card className="border-0 bg-white">
        <CardContent className="px-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-md">Customer Locations</h2>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-2 justify-between items-center text-sm mb-1">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="flex-[2] h-2 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white">
      <CardContent className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-md">Customer Locations</h2>
          <a
            href="/orders"
            className="text-sm text-[var(--color-theme)] hover:underline"
          >
            View Details
          </a>
        </div>
        <div className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Customer location analytics</p>
            <p className="text-xs">Available with order data</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
