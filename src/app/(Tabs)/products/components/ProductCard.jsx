import { FaEdit, FaChartBar, FaTrash, FaStar } from "react-icons/fa";
import Tag from "./Tag";

export default function ProductCard({ product }) {
  const getTagColor = (tag) => {
    switch (tag) {
      case "Featured":
        return "bg-green-600";
      case "In Stock":
        return "bg-emerald-500";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col gap-3">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover rounded-lg"
        />
        <div className="absolute top-2 right-2 flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Tag key={tag} label={tag} color={getTagColor(tag)} />
          ))}
        </div>
      </div>

      <div className="p-2">
        <div className="flex justify-between">
          <h3 className="font-semibold text-sm text-gray-800">
            {product.name}
          </h3>
          <h3 className="font-semibold text-sm text-[#D97706] flex items-center gap-1">
            <FaStar />
            {product.rating}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-1">{product.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-emerald-600">
              ${product.price.toFixed(2)}
            </span>
            <span className="line-through text-gray-400 text-xs">
              ${product.oldPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Stock:{" "}
            {product.stock > 0 ? (
              product.stock
            ) : (
              <span className="text-red-500">0</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 border-t p-2 pt-3">
        <button className="flex items-center gap-1 hover:text-emerald-600 cursor-pointer">
          <FaEdit className="h-4 w-4" /> Edit
        </button>
        <button className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
          <FaChartBar className="h-4 w-4" /> Stats
        </button>
        <button className="flex items-center gap-1 hover:text-red-500 cursor-pointer">
          <FaTrash className="h-4 w-4" /> Delete
        </button>
      </div>
    </div>
  );
}
