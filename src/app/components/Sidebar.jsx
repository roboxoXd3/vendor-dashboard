"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CiShop } from "react-icons/ci";
import { FaChartLine, FaCartShopping, FaMoneyBillWave } from "react-icons/fa6";
import { FaBox, FaChartPie } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut, FiX } from "react-icons/fi";
import Image from "next/image";

const menu = [
  { name: "Dashboard", icon: <FaChartLine />, href: "/dashboard" },
  { name: "Products", icon: <FaBox />, href: "/products" },
  { name: "Orders", icon: <FaCartShopping />, href: "/orders" },
  { name: "Payouts", icon: <FaMoneyBillWave />, href: "/payouts" },
  { name: "Analytics", icon: <FaChartPie />, href: "/analytics" },
  { name: "Support", icon: <BiSupport />, href: "/support" },
  { name: "Settings", icon: <IoMdSettings />, href: "/settings" },
];

export default function Sidebar({ onClose, isOpen }) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:block
      `}
    >
      <div>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-[var(--color-theme)] text-3xl">
              <CiShop />
            </span>{" "}
            <Link href="/"> Vendor Panel</Link>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 text-2xl hover:text-black"
          >
            <FiX />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-2 p-4 text-xl font-semibold border-b border-gray-200">
          <span className="text-[var(--color-theme)] text-[18px]">
            <CiShop size={30} />
          </span>{" "}
          <Link href="/"> Vendor Panel</Link>
        </div>

        {/* Menu */}
        <nav className="mt-4 flex flex-col gap-1">
          {menu.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={`flex items-center gap-3 py-3 px-6 text-[16px] transition-all duration-200 
                  ${
                    isActive
                      ? "bg-[var(--color-theme-light)] text-[var(--color-theme)] border-l-[4px] border-[var(--color-theme)]"
                      : "text-gray-500"
                  }
                  hover:bg-[var(--color-theme-light)] hover:text-[var(--color-theme)] hover:border-l-[4px] hover:border-[var(--color-theme)]`}
              >
                <span
                  className={`${
                    isActive ? "text-[var(--color-theme)]" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 flex justify-between items-center fixed bottom-0 w-full">
        <div className="flex gap-3 items-center">
          <Image
            src="/avatar.png"
            alt="avatar"
            className="rounded-full object-cover"
            width={24}
            height={24}
          />
          <div className="text-sm">
            <div className="font-medium">TechGear Shop</div>
            <div className="text-gray-500 text-xs">Verified Vendor</div>
          </div>
        </div>
        <div className="cursor-pointer text-xl text-gray-500 hover:text-black">
          <FiLogOut />
        </div>
      </div>
    </aside>
  );
}
