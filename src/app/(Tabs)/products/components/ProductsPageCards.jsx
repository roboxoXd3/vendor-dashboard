import { MdCheckCircle, MdError, MdInventory2 } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6";

const items = [
  {
    title: "Total Products",
    value: "45",
    icon: <MdInventory2 size={20} color="blue" />,
    color: "bg-blue-200",
    percent: "10%",
    label: "5 new products this month",
  },
  {
    title: "Active Products",
    value: "42",
    icon: <MdCheckCircle size={20} color="green" />,
    color: "bg-green-200",
    percent: "5%",
    label: "of total products",
  },
  {
    title: "Out Of Stock",
    value: "6",
    icon: <MdError size={20} color="red" />,
    color: "bg-red-200",
    percent: "2%",
    label: "12.5% of total products",
  },
  {
    title: "Featured Products",
    value: "25",
    icon: <FaStar size={20} color="brown" />,
    color: "bg-yellow-200",
    percent: "2%",
    label: "16.7% of total products",
  },
];

export default function ProductPageCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-sm rounded-lg p-5 flex flex-col justify-between h-full"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-500">
              {item.title}
            </h3>
            <div
              className={`p-3 rounded-full ${item.color} text-white text-xl`}
            >
              {item.icon}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-3 relative max-w-fit">
              <p className="font-bold text-lg md:text-[30px]">{item.value}</p>
              <span className="text-sm font-semibold text-[var(--color-theme)] flex items-center absolute right-[-40px] bottom-[-3px]">
                <FaArrowUp className="md:pt-1.5 md:text-xl" />
                {item.percent}
              </span>
            </div>
            <p className="text-sm text-gray-500 text-[12px]">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
