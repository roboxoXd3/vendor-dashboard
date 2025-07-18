import { FaEye, FaPercentage, FaTag } from "react-icons/fa";
import { RiArrowGoBackLine } from "react-icons/ri";
import { FaArrowUp } from "react-icons/fa6";

const items = [
  {
    title: "Product Views",
    value: "8492",
    icon: <FaEye color="blue" />,
    color: "bg-blue-200",
    percent: "18.2%",
    label: "Compared to last month",
  },
  {
    title: "Conversion Rate",
    value: "4.5%",
    icon: <FaPercentage color="green" />,
    color: "bg-green-200",
    percent: "0.5%",
    label: "Compared to last month",
  },
  {
    title: "Avg. Order Value",
    value: "$94.32",
    icon: <FaTag color="brown" size={13} />,
    color: "bg-yellow-200",
    percent: "3.1%",
    label: "Compared to last month",
  },
  {
    title: "Return Rate",
    value: "1.2%",
    icon: <RiArrowGoBackLine color="red" />,
    color: "bg-red-200",
    percent: "0.3%",
    label: "Compared to last month",
  },
];

export default function DashboardPageCards() {
  return (
    <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-500">{item.title}</h3>
            <div className={`p-2 rounded-full ${item.color}`}>{item.icon}</div>
          </div>
          <div className="mt-2 flex flex-col">
            <div className="flex items-center gap-2 mb-2 w-fit relative">
              <p className="font-bold text-lg md:text-[30px]">{item.value}</p>
              <span className="text-sm font-semibold text-[var(--color-theme)] flex items-center absolute right-[-50px] bottom-[-5px]">
                <FaArrowUp /> {item.percent}
              </span>
            </div>
            <p className="text-xs md:text-[12px] text-gray-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
