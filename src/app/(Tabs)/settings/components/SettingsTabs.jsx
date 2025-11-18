"use client";
import { FaBuilding, FaShop } from "react-icons/fa6";
import { FaCreditCard, FaShieldAlt } from "react-icons/fa";

export default function SettingsTabs({ activeTab, setActiveTab, kycNeedsAction = false }) {
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
      {tabss.map((tab) => {
        const isKycTab = tab.title === "Business & KYC";
        const showAlert = isKycTab && kycNeedsAction;
        
        return (
          <button
            key={tab.title}
            onClick={() => setActiveTab(tab.title)}
            className={`relative flex items-center gap-2 flex-1 min-w-[120px] text-center px-4 py-3 text-sm font-medium border-b-2 transition cursor-pointer rounded-md ${
              activeTab === tab.title
                ? "border-[var(--color-theme)] bg-[var(--color-theme-light)] text-[var(--color-theme)]"
                : showAlert
                ? "border-transparent text-orange-600 hover:text-orange-700 font-semibold"
                : "border-transparent text-gray-600 hover:text-[var(--color-theme)]"
            }`}
          >
            {tab.icon} {tab.title}
            {showAlert && (
              <>
                {/* Pulsing red dot */}
                <span className="absolute top-2 right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
