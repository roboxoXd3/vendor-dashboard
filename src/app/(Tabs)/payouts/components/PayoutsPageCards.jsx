"use client";

import { useState, useEffect } from "react";
import { FaWallet, FaClock, FaChartLine, FaInfoCircle } from "react-icons/fa";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

export default function PayoutPageCards() {
  const [payoutData, setPayoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatPrice } = useCurrencyContext();

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payouts');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payout data');
      }

      setPayoutData(result.data);
    } catch (err) {
      console.error('Error fetching payout data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format payout amounts with proper currency
  const formatPayoutAmount = (amount, currency = null) => {
    const numericAmount = parseFloat(amount);
    return formatPrice(numericAmount, currency);
  };

  const getCards = () => {
    if (!payoutData) return [];

    // Get currency from API response or fallback to USD
    const payoutCurrency = payoutData.currency || 'USD';

    return [
      {
        title: "Available Balance",
        amount: formatPayoutAmount(payoutData.availableBalance, payoutCurrency),
        subtitle: "Available for withdrawal",
        icon: <FaWallet className="text-green-600" />,
        iconBg: "bg-green-100",
        button: "Withdraw Funds",
        buttonClass: "text-white",
      },
      {
        title: "Pending Balance",
        amount: formatPayoutAmount(payoutData.pendingBalance, payoutCurrency),
        subtitle: "Funds in escrow (will be released in 7–14 days)",
        icon: <FaClock className="text-yellow-600" />,
        iconBg: "bg-yellow-100",
        alert: {
          icon: <FaInfoCircle size={20} className="text-yellow-700 mt-1" />,
          text: "Funds are held in escrow until the order is confirmed as delivered and the return period has expired.",
        },
      },
      {
        title: "Lifetime Earnings",
        amount: formatPayoutAmount(payoutData.lifetimeEarnings, payoutCurrency),
        subtitle: "Total earnings since you joined",
        icon: <FaChartLine className="text-blue-600" />,
        iconBg: "bg-blue-100",
        extra: {
          thisMonth: formatPayoutAmount(payoutData.thisMonthEarnings, payoutCurrency),
          lastMonth: formatPayoutAmount(payoutData.lastMonthEarnings, payoutCurrency),
        },
      },
    ];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-lg shadow-sm relative flex flex-col justify-between h-full animate-pulse"
          >
            <div className="absolute top-4 right-4 p-3 rounded-full bg-gray-200 w-12 h-12"></div>
            <div className="mb-4">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error loading payout data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchPayoutData}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const cards = getCards();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white p-5 rounded-lg shadow-sm relative flex flex-col justify-between h-full"
        >
          <div
            className={`absolute top-4 right-4 p-3 rounded-full ${card.iconBg}`}
          >
            {card.icon}
          </div>

          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500">{card.title}</h2>
            <p className="text-2xl font-bold text-gray-800 mt-3 mb-1">
              {card.amount}
            </p>
            <p className="text-sm text-gray-500 text-[12px]">{card.subtitle}</p>
          </div>

          {card.button && (
            <button
              className={`${card.buttonClass} text-sm px-4 py-2 rounded w-full mb-3`}
              style={{ backgroundColor: "var(--color-theme)" }}
            >
              {card.button}
            </button>
          )}

          {card.alert && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm p-3 rounded flex items-start gap-2 mb-3">
              {card.alert.icon}
              <span>{card.alert.text}</span>
            </div>
          )}

          {card.extra && (
            <div className="flex justify-between text-sm border-t-1 border-gray-300 pt-3 mt-3">
              <div>
                <p className="text-gray-500">This Month</p>
                <p className="font-semibold">{card.extra.thisMonth}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Month</p>
                <p className="font-semibold">{card.extra.lastMonth}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
