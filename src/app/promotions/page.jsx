"use client";

import { Button } from "@/components/ui/button";

/**
 * Promotions are not backed by a Django API yet.
 * Keep a safe empty state instead of crashing on fake hardcoded data.
 */
export default function PromotionPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Promotions</h1>
        <Button disabled title="Coming soon">+ Create New Promotion</Button>
      </div>

      <div className="bg-white border rounded-lg p-10 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Promotions coming soon</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Vendor promotions are not available yet. This page will light up once
          the promotions API is ready on the backend.
        </p>
      </div>
    </div>
  );
}
