import AnalyticsFilterBar from "./components/AnalyticsFilterBar";
import AnalyticsPageCards from "./components/AnalyticsPageCards";
import ConversionFunnel from "./components/ConversionFunnel";
import ProductViewsOverTime from "./components/ProductViewsOverTime";
import ConversionRateByProduct from "./components/ConversinRateByProduct";
import ProductsPerformance from "./components/ProductsPerformance";

export default function AnalyticsPage() {
  return (
    <div className="p-4 grid gap-6 max-w-screen-xl mx-auto">
      <AnalyticsFilterBar />
      <AnalyticsPageCards />
      <ConversionFunnel />

      {/* Responsive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="lg:col-span-1">
          <ProductViewsOverTime />
        </div>
        <div className="lg:col-span-1">
          <ConversionRateByProduct />
        </div>
      </div>

      <ProductsPerformance />
    </div>
  );
}
