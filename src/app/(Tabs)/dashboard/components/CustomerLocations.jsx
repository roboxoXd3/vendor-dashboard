"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const locations = [
  { name: "New York", percent: 35 },
  { name: "California", percent: 28 },
  { name: "Texas", percent: 17 },
  { name: "Florida", percent: 12 },
];

export default function CustomerLocations() {
  return (
    <Card className="border-0 bg-white">
      <CardContent className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-md">Customer Locations</h2>
          <a
            href="#"
            className="text-sm text-[var(--color-theme)] hover:underline"
          >
            View Details
          </a>
        </div>
        <div className="space-y-4">
          {locations.map((loc, i) => (
            <div key={i}>
              <div className="flex gap-2 justify-between items-center text-sm mb-1">
                <span className="flex-1 text-gray-500">{loc.name}</span>
                <Progress
                  value={loc.percent}
                  className="flex-[2] h-2 bg-gray-200 [&>div]:bg-[var(--color-theme)]"
                />
                <span className="font-bold">{loc.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
