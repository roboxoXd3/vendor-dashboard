import { FaDollarSign, FaShoppingCart, FaTag } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6";

const items = [
  {
    title: "Total Revenue",
    value: "$12,345",
    icon: <FaDollarSign size={20} color="green" />,
    color: "bg-green-200",
    percent: "10%",
    label: "Compared to last month",
  },
  {
    title: "Total Orders",
    value: "150",
    icon: <FaShoppingCart size={20} color="blue" />,
    color: "bg-blue-200",
    percent: "5%",
    label: "Compared to last month",
  },
  {
    title: "Avg. Order Value",
    value: "$25",
    icon: <FaTag size={16} color="brown" />,
    color: "bg-yellow-200",
    percent: "2%",
    label: "Compared to last month",
  },
];

export default function DashboardPageCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg p-6 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-lg font-semibold text-gray-500">
                {item.title}
              </h3>
              <div className={`p-2 rounded-full ${item.color} text-white`}>
                {item.icon}
              </div>
            </div>
            <div className="mt-2 flex flex-col">
              <div className="flex items-center gap-2 mb-1 w-fit relative">
                <p className="font-bold text-lg md:text-[30px]">{item.value}</p>
                <span className="text-sm font-semibold text-[var(--color-theme)] flex items-center absolute right-[-40px] bottom-[-3px]">
                  <FaArrowUp className="md:pt-1.5 md:text-xl" />
                  {item.percent}
                </span>
              </div>
              <p className="text-xs md:text-[12px] text-gray-500">
                {item.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
