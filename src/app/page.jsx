import LoginCard from "./components/LoginCard";
import { FaChartLine } from "react-icons/fa6";
import { FaShieldAlt } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { AiFillShop } from "react-icons/ai";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg flex flex-col md:flex-row w-full overflow-hidden min-h-screen">
        {/* Left Panel */}
        <div className="w-full bg-gradient-to-b from-[#10B981] to-[#03835a] lg:bg-gradient-to-br lg:from-[#10B981] lg:to-[#03835a] p-8 md:p-10 text-white flex flex-col justify-center relative">
          <div className="absolute bottom-6 left-10 md:left-20 w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full"></div>
          <div className="absolute top-10 right-10 md:right-15 w-14 h-14 md:w-18 md:h-18 bg-white/10 rounded-full"></div>

          <div className="text-center flex flex-col items-center md:items-start md:pl-10">
            <div className="flex flex-col items-center">
              <div className="backdrop-blur-md bg-white/30 p-4 text-4xl mb-3 w-fit rounded-full">
                <AiFillShop size={25} />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                <Link href={"/dashboard"}>Vendor Portal</Link>
              </h2>
              <p className="mb-8 text-md opacity-90 max-w-xs md:max-w-80 text-center">
                Join thousands of successful vendors and grow your business with
                our comprehensive platform.
              </p>

              <ul className="space-y-4 text-sm w-full flex flex-col pl-5 md:pl-10">
                <li className="flex gap-3">
                  <span className="backdrop-blur-md bg-white/30 p-3 rounded-lg">
                    <FaChartLine size={20} />
                  </span>
                  <div>
                    <strong>Analytics Dashboard</strong>
                    <br />
                    <span className="text-gray-200">
                      Track your sales and performance
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="backdrop-blur-md bg-white/30 p-3 rounded-lg">
                    <FaShieldAlt size={20} />
                  </span>
                  <div>
                    <strong>Secure Payments</strong>
                    <br />
                    <span className="text-gray-200">
                      Safe and reliable transactions
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="backdrop-blur-md bg-white/30 p-3 rounded-lg">
                    <IoIosPeople size={20} />
                  </span>
                  <div>
                    <strong>Customer Support</strong>
                    <br />
                    <span className="text-gray-200">
                      24/7 dedicated support team
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full">
          <div className="h-fit md:min-h-screen p-6 bg-gradient-to-b lg:bg-gradient-to-r from-[#10B981] to-[#F9FAFB] flex items-center justify-center">
            <LoginCard />
          </div>
        </div>
      </div>
    </div>
  );
}
