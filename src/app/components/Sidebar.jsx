"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineStar,
  HiOutlineQuestionMarkCircle,
  HiOutlineMegaphone,
  HiOutlineCog,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
  HiOutlineViewColumns,
} from "react-icons/hi2";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: HiOutlineHome },
  { name: "Products", href: "/products", icon: HiOutlineCube },
  { name: "Size Charts", href: "/size-charts", icon: HiOutlineViewColumns },
  { name: "Orders", href: "/orders", icon: HiOutlineShoppingCart },
  { name: "Reviews", href: "/reviews", icon: HiOutlineStar },
  { name: "Questions", href: "/questions", icon: HiOutlineQuestionMarkCircle },
  { name: "Payouts", href: "/payouts", icon: HiOutlineCurrencyDollar },
  { name: "Analytics", href: "/analytics", icon: HiOutlineChartBar },
  { name: "Support", href: "/support", icon: HiOutlineMegaphone },
  { name: "Settings", href: "/settings", icon: HiOutlineCog },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, vendor, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside
      className={`fixed z-50 lg:static top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div>
        <div className="p-3.5 text-lg font-bold flex items-center justify-between gap-2 border-b border-gray-200 lg:justify-start">
          <div className="bg-[var(--color-theme)] p-2 rounded-md">
            <HiOutlineCube className="text-white w-5 h-5" />
          </div>
          Vendor Panel
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-gray-500"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <ul className="px-2 pt-4 space-y-1">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={name}>
                <Link
                  href={href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm ${
                    active
                      ? "bg-green-500/10 border-l-4 border-[var(--color-theme)] text-[var(--color-theme)] font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-[var(--color-theme)]" : "text-gray-400"
                    }`}
                  />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            src="/avatar.png"
            alt="User"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">{vendor?.business_name || 'Vendor'}</p>
            <p className="text-xs text-gray-500 capitalize">{vendor?.status === 'approved' ? 'Verified Vendor' : vendor?.status || 'Pending'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-gray-100 cursor-pointer rounded transition-colors"
            title="Sign Out"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </aside>
  );
}
