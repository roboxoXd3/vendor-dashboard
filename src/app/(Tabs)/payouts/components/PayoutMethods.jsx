"use client";
import { useState } from "react";
import { FaUniversity } from "react-icons/fa";
import { SiPaypal } from "react-icons/si";

export default function PayoutMethods({ methods }) {
  const [payoutMethods, setPayoutMethods] = useState(methods);

  const handleMakeDefault = (index) => {
    const updated = payoutMethods.map((method, i) => ({
      ...method,
      default: i === index,
    }));
    setPayoutMethods(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 w-full h-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Payout Methods</h2>
        <button className="text-[var(--color-theme)] text-sm hover:underline focus:outline-none">
          + Add New
        </button>
      </div>

      {payoutMethods.map((m, i) => (
        <div
          key={i}
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded border mb-3 gap-3 
            ${
              m.default
                ? "bg-[var(--color-theme-light)] border-gray-300"
                : "border-gray-300"
            }`}
        >
          <div className="flex items-center gap-3">
            {m.type === "Paypal" ? (
              <SiPaypal className="text-blue-500" size={20} />
            ) : (
              <FaUniversity className="text-gray-700" size={20} />
            )}
            <div className="flex flex-col">
              <span className="text-md font-semibold">{m.type}</span>
              <span className="text-sm text-gray-500">{m.label}</span>
            </div>
          </div>

          {m.default ? (
            <span className="bg-[var(--color-theme)] text-xs text-white px-3 py-1 rounded-xl cursor-pointer">
              Default
            </span>
          ) : (
            <button
              onClick={() => handleMakeDefault(i)}
              className="text-xs text-[var(--color-theme)] hover:underline focus:outline-none cursor-pointer"
            >
              Make Default
            </button>
          )}
        </div>
      ))}

      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        Withdrawal minimum: $50.00
        <br />
        Processing time: 1–3 business days
      </p>
    </div>
  );
}
