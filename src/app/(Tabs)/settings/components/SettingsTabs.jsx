"use client";
import { FaBuilding, FaShop } from "react-icons/fa6";
import { FaCreditCard, FaShieldAlt } from "react-icons/fa";

export default function SettingsTabs({ activeTab, setActiveTab }) {
  const tabs = ["General Info", "Business & KYC", "Payout Details", "Security"];

  const tabss = [
    {
      title: "General Info",
      icon: <FaShop />,
    },
    {
      title: "Business & KYC",
      icon: <FaBuilding />,
    },
    {
      title: "Payout Details",
      icon: <FaCreditCard />,
    },
    {
      title: "Security",
      icon: <FaShieldAlt />,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 bg-white shadow-md mb-6 border-gray-200 rounded-md px-4">
      {tabss.map((tab) => (
        <button
          key={tab.title}
          onClick={() => setActiveTab(tab.title)}
          className={`flex items-center gap-2 flex-1 min-w-[120px] text-center px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer rounded-md ${
            activeTab === tab.title
              ? "border-[var(--color-theme)] bg-[var(--color-theme-light)] text-[var(--color-theme)]"
              : "border-transparent text-gray-600 hover:text-[var(--color-theme)]"
          }`}
        >
          {tab.icon} {tab.title}
        </button>
      ))}
    </div>
  );
}
