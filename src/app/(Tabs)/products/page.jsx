import FeaturedProductsSection from "./components/FeaturedProductsSection";
import ProductsFilterBar from "./components/ProductsFilterBar";
import ProductPageCards from "./components/ProductsPageCards";

export default function Products() {
  return (
    <div className="p-4 space-y-6">
      <ProductsFilterBar />
      <ProductPageCards />
      <FeaturedProductsSection />
    </div>
  );
}
