"use client";

import { FiTablet, FiHeadphones } from "react-icons/fi";

const products = [
  {
    name: "Wireless Earbuds Pro",
    sku: "SKU: PRD-5823",
    price: "$89.99",
    sold: "128 sold",
    icon: <FiHeadphones />,
  },
  {
    name: "Noise Cancelling Headphones",
    sku: "SKU: PRD-5789",
    price: "$129.99",
    sold: "94 sold",
    icon: <FiHeadphones />,
  },
  {
    name: 'Smart Tablet 10"',
    sku: "SKU: PRD-5812",
    price: "$249.99",
    sold: "76 sold",
    icon: <FiTablet />,
  },
];

export default function BestSellingProducts() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold">Best Selling Products</h2>
        <a
          href="#"
          className="text-sm text-[var(--color-theme)] hover:underline"
        >
          View All Products
        </a>
      </div>
      <div className="space-y-8 p-4">
        {products.map((p, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-15 h-15 bg-gray-100 rounded-md flex items-center justify-center text-xl text-gray-500">
                {p.icon}
              </div>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">{p.sku}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{p.price}</p>
              <p className="text-sm" style={{ color: "var(--color-theme)" }}>
                {p.sold}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
