import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/hooks/useProducts";
import { Sparkles } from "lucide-react";

export function PersonalizedRecommendations() {
  const { user } = useAuth();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: async () => {
      // Get user's purchase history and browsing behavior
      const [ordersRes, viewedRes, wishlistRes] = await Promise.all([
        user ? supabase
          .from("order_items")
          .select("product_id, products(category_id, collection_id)")
          .eq("order_id", user.id)
          .limit(20) : Promise.resolve({ data: [] }),
        user ? supabase
          .from("recently_viewed")
          .select("product_id, products(category_id, collection_id)")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(10) : Promise.resolve({ data: [] }),
        user ? supabase
          .from("wishlist_items")
          .select("product_id, products(category_id, collection_id)")
          .eq("user_id", user.id)
          .limit(10) : Promise.resolve({ data: [] }),
      ]);

      // Extract category and collection preferences
      const categoryPrefs: Record<string, number> = {};
      const collectionPrefs: Record<string, number> = {};
      const viewedProductIds = new Set<string>();

      const processItems = (items: Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }> | null, weight: number) => {
        items?.forEach((item) => {
          viewedProductIds.add(item.product_id);
          if (item.products?.category_id) {
            categoryPrefs[item.products.category_id] = (categoryPrefs[item.products.category_id] || 0) + weight;
          }
          if (item.products?.collection_id) {
            collectionPrefs[item.products.collection_id] = (collectionPrefs[item.products.collection_id] || 0) + weight;
          }
        });
      };

      processItems(ordersRes.data as Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }>, 3);
      processItems(viewedRes.data as Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }>, 1);
      processItems(wishlistRes.data as Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }>, 2);

      // Get top categories and collections
      const topCategories = Object.entries(categoryPrefs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      const topCollections = Object.entries(collectionPrefs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

      // Fetch recommended products
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(8);

      if (topCategories.length > 0 || topCollections.length > 0) {
        // Build OR filter for categories and collections
        const filters = [];
        if (topCategories.length > 0) {
          filters.push(`category_id.in.(${topCategories.join(",")})`);
        }
        if (topCollections.length > 0) {
          filters.push(`collection_id.in.(${topCollections.join(",")})`);
        }
        query = query.or(filters.join(","));
      } else {
        // Fallback to best sellers and new arrivals for new users
        query = query.or("is_best_seller.eq.true,is_new_arrival.eq.true");
      }

      const { data: products, error } = await query;

      if (error) throw error;

      // Filter out products user has already viewed/purchased
      const filtered = products?.filter(p => !viewedProductIds.has(p.id)) || [];

      // If not enough, add some best sellers
      if (filtered.length < 4) {
        const { data: fallback } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .eq("is_best_seller", true)
          .limit(8 - filtered.length);

        const existingIds = new Set(filtered.map(p => p.id));
        fallback?.forEach(p => {
          if (!existingIds.has(p.id) && !viewedProductIds.has(p.id)) {
            filtered.push(p);
          }
        });
      }

      return filtered.slice(0, 8) as Product[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Just For You
            </p>
          </div>
          <h2 className="font-display text-3xl font-medium">
            Recommended For You
          </h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Handpicked styles based on your preferences and browsing history
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
          {recommendations.map((product) => (
            <div key={product.id} className="min-w-[280px] snap-center">
              <ProductCard
                key={product.id}
                product={product as Product}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
