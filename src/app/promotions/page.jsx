"use client";

import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
const promotions = [
  {
    name: "Summer Sale",
    type: "Percentage",
    value: "15% Off",
    uses: 124,
    start: "May 15, 2023",
    end: "June 15, 2023",
    status: "Active",
  },
  {
    name: "New Customer",
    type: "Fixed Amount",
    value: `${formatPrice(10, 'USD')} Off`,
    uses: 87,
    start: "April 1, 2023",
    end: "Ongoing",
    status: "Active",
  },
  {
    name: "Flash Sale",
    type: "Percentage",
    value: "25% Off",
    uses: 42,
    start: "May 20, 2023",
    end: "May 22, 2023",
    status: "Active",
  },
  {
    name: "Bundle Discount",
    type: "Percentage",
    value: "10% Off",
    uses: 38,
    start: "May 1, 2023",
    end: "June 30, 2023",
    status: "Active",
  },
];

export default function PromotionPage() {
  const { formatPrice } = useCurrencyContext();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Promotions</h1>
        <Button>+ Create New Promotion</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Active Promotions</p>
          <h2 className="text-2xl font-bold">4</h2>
          <p className="text-xs text-green-500">+2 Compared to last month</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Promotion Uses</p>
          <h2 className="text-2xl font-bold">253</h2>
          <p className="text-xs text-green-500">+18.2% Compared to last month</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Revenue from Promotions</p>
          <h2 className="text-2xl font-bold">{formatPrice(3842, 'USD')}</h2>
          <p className="text-xs text-green-500">+12.5% Compared to last month</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Promotion Performance</h3>
        <select className="border rounded-md text-sm px-3 py-2">
          <option>Last 30 Days</option>
        </select>
      </div>

      <div className="bg-white border rounded-lg p-4">
  <div className="flex justify-between items-center mb-4">
    <h4 className="font-medium text-gray-700">Active Promotions</h4>
    <div className="flex gap-2">
      <Button variant="outline" size="sm">Filter</Button>
      <Button variant="outline" size="sm">Sort</Button>
    </div>
  </div>

  {/* Desktop Table */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-sm text-left min-w-[800px]">
      <thead className="text-gray-400 border-b">
        <tr className="h-10">
          <th>Promotion Name</th>
          <th>Type</th>
          <th>Value</th>
          <th>Uses</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {promotions.map((promo, idx) => (
          <tr key={idx} className="border-t h-14">
            <td>{promo.name}</td>
            <td>{promo.type}</td>
            <td>{promo.value}</td>
            <td>{promo.uses}</td>
            <td>{promo.start}</td>
            <td>{promo.end}</td>
            <td>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                {promo.status}
              </span>
            </td>
            <td className="flex gap-2 h-14 items-center text-gray-500">
              <HiOutlinePencil className="cursor-pointer hover:text-brand" />
              <HiOutlineTrash className="cursor-pointer hover:text-red-500" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Mobile Cards */}
  <div className="md:hidden space-y-4">
    {promotions.map((promo, idx) => (
      <div key={idx} className="border rounded-lg p-4 text-sm shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h5 className="font-semibold">{promo.name}</h5>
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
            {promo.status}
          </span>
        </div>
        <p className="text-gray-500 mb-2">{promo.type} • {promo.value}</p>
        <div className="grid grid-cols-2 gap-2 text-gray-700 text-xs">
          <p><span className="font-medium">Uses:</span> {promo.uses}</p>
          <p><span className="font-medium">Start:</span> {promo.start}</p>
          <p><span className="font-medium">End:</span> {promo.end}</p>
        </div>
        <div className="flex gap-3 mt-3 text-gray-500">
          <HiOutlinePencil className="cursor-pointer hover:text-brand" />
          <HiOutlineTrash className="cursor-pointer hover:text-red-500" />
        </div>
      </div>
    ))}
  </div>
</div>

      {/* Promotion Upgrade CTA */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 border rounded-lg">
          <h4 className="font-semibold mb-1">Unlock Advanced Promotion Features</h4>
          <p className="text-sm text-gray-600 mb-3">
            Upgrade to Premium to access advanced promotion tools, including product bundles,
            tiered discounts, and targeted customer promotions.
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Scheduled promotions
            </li>
            <li>✅ Customer targeting</li>
            <li>✅ Product bundles</li>
            <li>✅ Advanced analytics</li>
          </ul>
          <Button className="mt-4">Upgrade to Premium</Button>
        </div>
        <div className="bg-green-100 p-6 rounded-lg text-center flex flex-col justify-center items-center">
          <h4 className="text-lg font-bold">Premium Plan</h4>
          <p className="text-sm">Unlock all features</p>
          <h2 className="text-3xl font-bold mt-2">{formatPrice(29.99, 'USD')}/mo</h2>
        </div>
      </div>
    </div>
  );
}
