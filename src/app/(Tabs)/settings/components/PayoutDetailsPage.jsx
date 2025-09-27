"use client";
import BankAccountInformationSection from "./BankAccountInformationSection";
import { FaCircleInfo } from "react-icons/fa6";
import {
  FaCheckCircle,
  FaCalendar,
  FaShieldAlt,
  FaLock,
  FaSave,
} from "react-icons/fa";
import { MdOutlinePhoneAndroid } from "react-icons/md";
import { useCurrencyContext } from "@/contexts/CurrencyContext";

export default function PayoutDetailsPage() {
  const { formatPrice } = useCurrencyContext();
  
  return (
    <div className="max-w-screen mx-auto bg-white shadow-md p-4 md:p-6 rounded-lg space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold">Payout Details</h2>
          <p className="text-sm text-gray-500">
            Manage your payment receiving information for escrow releases and
            payouts
          </p>
        </div>
        <span className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 text-sm rounded-full">
          <FaCheckCircle /> Verified
        </span>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5 border-b border-gray-300">
        {/* Left Form */}
        <div className="md:col-span-2 space-y-4">
          <BankAccountInformationSection />
        </div>

        {/* Right Status */}
        <div className="space-y-4">
          <div className="p-6 flex flex-col gap-2 rounded-lg border bg-[var(--color-theme-light)] border-[var(--color-theme)]">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FaCircleInfo className="text-[var(--color-theme)]" /> Current
              Setup
            </h3>

            <div>
              <span className="text-gray-500 text-[12px]">Payout Method</span>
              <br />
              <span className="flex items-center gap-2 text-[14px]">
                <MdOutlinePhoneAndroid className="text-[var(--color-theme)]" />{" "}
                UPI Transfer
              </span>
            </div>

            <div>
              <span className="text-gray-500 text-[12px]">Status</span>
              <br />
              <span className="flex items-center gap-2 text-[14px] text-[var(--color-theme)]">
                <FaCheckCircle /> Verified
              </span>
            </div>

            <div>
              <span className="text-gray-500 text-[12px]">Last Updated</span>
              <br />
              <span className="text-black text-[14px] font-normal">
                December 10, 2024
              </span>
            </div>

            <div>
              <span className="text-gray-500 text-[12px]">
                Next Scheduled Payout
              </span>
              <br />
              <span className="flex items-center gap-2 text-black text-[14px] font-medium">
                <FaCalendar className="text-[var(--color-theme)]" /> December
                22, 2024
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-[var(--color-theme)] text-[12px]">
              <p className="text-sm text-gray-500">Available Balance</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[var(--color-theme)] text-2xl font-bold">
                  {formatPrice(2847.50, 'USD')}
                </p>
                <a href="#" className="text-xs text-[var(--color-theme)]">
                  View Details
                </a>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-blue-50 p-4 border border-blue-200 text-sm rounded-lg">
            <h4 className="flex items-center gap-2 font-semibold mb-1 text-blue-700 text-[14px]">
              <FaShieldAlt className="pt-2 min-h-10" /> Security Notice
            </h4>
            <p className="text-blue-600 pl-5 text-[12px]">
              Your payment information is encrypted and securely stored. Changes
              may require verification and could delay next payout.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-wrap justify-between items-center gap-4 mt-6">
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <FaLock /> All payment information is encrypted and stored securely
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100">
            Cancel Changes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--color-theme)] text-white cursor-pointer">
            <FaSave /> Save Payout Details
          </button>
        </div>
      </div>
    </div>
  );
}
