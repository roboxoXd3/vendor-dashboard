"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCustomerLocations } from '@/hooks/useVendor';

export default function CustomerLocations({ filters = {} }) {
  const { data: locationsData, isLoading, error } = useCustomerLocations(filters);

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

  if (error) {
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
          <div className="text-center py-8 text-red-500">
            <p className="text-sm">Error loading location data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const locations = locationsData?.data || [];

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
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No location data available</p>
              <p className="text-xs">Customer locations will appear here</p>
            </div>
          ) : (
            locations.map((location, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2 justify-between items-center text-sm">
                  <span className="font-medium">{location.location}</span>
                  <span className="text-gray-500">{location.orders_count} orders</span>
                </div>
                <Progress 
                  value={location.percentage} 
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
