import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useProducts } from "@/hooks/useProducts";
import { X, Plus, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { addToCart } = useCart();

  const { compareIds, addToCompare: addToCompareHook, removeFromCompare: removeFromCompareHook } = useCompare();
  
  // Update URL params when compareIds change
  useEffect(() => {
    if (compareIds.length > 0) {
      setSearchParams({ ids: compareIds.join(",") }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [compareIds, setSearchParams]);

  // Initialize from URL if empty (optional, for sharing links)
  useEffect(() => {
    const urlIds = searchParams.get("ids")?.split(",").filter(Boolean);
    if (urlIds && urlIds.length > 0 && compareIds.length === 0) {
       urlIds.forEach(id => addToCompareHook(id));
    }
  }, []); // Run once on mount

  const [showSelector, setShowSelector] = useState(false);

  const compareProducts = products.filter((p) => compareIds.includes(p.id));
  const availableProducts = products.filter((p) => !compareIds.includes(p.id));

  const addToCompare = (id: string) => {
    const success = addToCompareHook(id);
    if (!success) {
      if (compareIds.length >= 3) {
         toast.error("Maximum 3 products can be compared");
      }
      return;
    }
    setShowSelector(false);
  };

  const removeFromCompare = (id: string) => {
    removeFromCompareHook(id);
  };

  const handleAddToCart = (productId: string) => {
    const product = compareProducts.find((p) => p.id === productId);
    if (product) {
      addToCart({
        id: parseInt(productId.slice(0, 8), 16), // Convert UUID to number for cart
        name: product.name,
        price: product.price,
        image: product.image_url || "/placeholder.svg",
        ownerSize: product.sizes?.[0] || "M",
        petSize: product.pet_sizes?.[0] || "M",
      });
      toast.success("Added to cart");
    }
  };

  const featureLabels = [
    { key: "price", label: "Price" },
    { key: "original_price", label: "Original Price" },
    { key: "category", label: "Category" },
    { key: "collection", label: "Collection" },
    { key: "sizes", label: "Available Sizes" },
    { key: "pet_sizes", label: "Pet Sizes" },
    { key: "features", label: "Features" },
    { key: "stock", label: "In Stock" },
  ];

  const getFeatureValue = (product: typeof compareProducts[0], key: string) => {
    switch (key) {
      case "price":
        return `₹${product.price.toFixed(2)}`;
      case "original_price":
        return product.original_price ? `₹${product.original_price.toFixed(2)}` : "—";
      case "category":
        return product.category?.name || "—";
      case "collection":
        return product.collection?.name || "—";
      case "sizes":
        return product.sizes?.length ? product.sizes.join(", ") : "—";
      case "pet_sizes":
        return product.pet_sizes?.length ? product.pet_sizes.join(", ") : "—";
      case "features":
        return product.features?.length ? product.features.join(", ") : "—";
      case "stock":
        return (product.stock ?? 0) > 0 ? (
          <span className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" /> In Stock
          </span>
        ) : (
          <span className="text-red-500">Out of Stock</span>
        );
      default:
        return "—";
    }
  };

  return (
    <PageLayout>
      <section className="bg-muted py-12 md:py-16">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          
          <div className="text-center">
            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Compare
            </p>
            <h1 className="mb-4 font-display text-4xl md:text-5xl font-medium tracking-tight">
              Compare Products
            </h1>
            <p className="mx-auto max-w-xl font-body text-lg text-muted-foreground">
              Select up to 3 products to compare features side by side
            </p>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className="w-[25%] border-b border-border p-4 text-left font-body text-sm font-medium text-muted-foreground">
                      Feature
                    </th>
                    {[0, 1, 2].map((index) => {
                      const product = compareProducts[index];
                      return (
                        <th key={index} className="w-[25%] border-b border-border p-4 align-bottom">
                          {product ? (
                            <div className="relative">
                              <button
                                onClick={() => removeFromCompare(product.id)}
                                className="absolute -right-2 -top-2 rounded-full bg-muted p-1 transition-colors hover:bg-destructive hover:text-destructive-foreground z-10"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/product/${product.slug}`)}
                                className="block w-full"
                              >
                                <div className="mx-auto w-32 aspect-[3/4] mb-3 overflow-hidden bg-muted">
                                   <img
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="font-display text-base leading-tight line-clamp-2">{product.name}</p>
                              </button>
                            </div>
                          ) : (
                            <div className="h-full flex items-end justify-center pb-8">
                               {index === compareProducts.length && (
                                <button
                                  onClick={() => setShowSelector(true)}
                                  className="flex h-32 w-32 flex-col items-center justify-center gap-2 border-2 border-dashed border-border transition-colors hover:border-foreground hover:bg-muted"
                                >
                                  <Plus className="h-6 w-6 text-muted-foreground" />
                                  <span className="font-body text-xs text-muted-foreground">
                                    Add Product
                                  </span>
                                </button>
                               )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {featureLabels.map((feature) => (
                    <tr key={feature.key}>
                      <td className="border-b border-border p-4 font-body text-sm font-medium">
                        {feature.label}
                      </td>
                      {[0, 1, 2].map((index) => {
                         const product = compareProducts[index];
                         return (
                            <td
                              key={index}
                              className="border-b border-border p-4 text-center font-body text-sm"
                            >
                              {product ? getFeatureValue(product, feature.key) : "—"}
                            </td>
                         );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-4" />
                    {[0, 1, 2].map((index) => {
                       const product = compareProducts[index];
                       return (
                        <td key={index} className="p-4 text-center">
                          {product && (
                            <button
                              onClick={() => handleAddToCart(product.id)}
                              className="inline-flex w-full justify-center items-center gap-2 bg-foreground px-4 py-3 font-body text-sm text-background transition-opacity hover:opacity-90"
                            >
                              <ShoppingBag className="h-4 w-4" />
                              Add
                            </button>
                          )}
                        </td>
                       );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {compareProducts.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <p className="mb-4 font-display text-2xl">No products to compare</p>
              <p className="mb-6 font-body text-muted-foreground">
                Add products from our shop to compare them
              </p>
              <button
                onClick={() => setShowSelector(true)}
                className="inline-flex items-center gap-2 bg-foreground px-8 py-3 font-body text-sm text-background transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add Products
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Product Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-display text-xl">Select a Product</h3>
              <button
                onClick={() => setShowSelector(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {availableProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCompare(product.id)}
                    className="border border-border p-3 text-left transition-colors hover:bg-muted"
                  >
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="mb-2 aspect-square w-full object-cover"
                    />
                    <p className="font-body text-sm font-medium line-clamp-2">
                      {product.name}
                    </p>
                    <p className="font-body text-sm text-muted-foreground">
                      ₹{product.price.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
