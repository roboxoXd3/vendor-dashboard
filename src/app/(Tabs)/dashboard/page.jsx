import BestSellingProducts from "./components/BestSellingProducts";
import RecentOrders from "./components/RecentOrders";
import CustomerLocations from "./components/CustomerLocations";
import InventoryStatus from "./components/InventoryStatus";
import DashboardPageCards from "./components/DashboardPageCards";
import DashboardFilterBar from "./components/DashboardFilterBar";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 p-4">
      <DashboardFilterBar />
      <DashboardPageCards />

      {/* Sales Trend Placeholder */}
      <div className="bg-white min-h-[200px] md:min-h-[240px] rounded-xl shadow-sm p-4 flex items-center justify-center text-gray-400">
        Sales Trend Chart (Coming Soon)
      </div>

      {/* Best Selling & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestSellingProducts />
        <RecentOrders />
      </div>

      {/* Customer Locations & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerLocations />
        <InventoryStatus />
      </div>
    </div>
  );
}
