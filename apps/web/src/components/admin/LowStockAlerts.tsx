import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { AlertTriangle, Package } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  low_stock_threshold: number;
  image_url: string | null;
}

export function LowStockAlerts() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, low_stock_threshold, image_url")
        .eq("is_active", true)
        .order("stock", { ascending: true });

      if (error) throw error;
      
      // Filter products where stock is below or equal to threshold
      return (data as LowStockProduct[]).filter(
        p => p.stock <= (p.low_stock_threshold || 10)
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">All products are well stocked!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{products.length} products need restocking</span>
      </div>

      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-3 border rounded-lg"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                Threshold: {product.low_stock_threshold || 10}
              </p>
            </div>
            <div className={`text-right ${
              product.stock === 0 ? "text-red-600" : "text-amber-600"
            }`}>
              <p className="text-2xl font-bold">{product.stock}</p>
              <p className="text-xs">in stock</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
