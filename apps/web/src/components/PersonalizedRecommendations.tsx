import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/hooks/useProducts";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export function PersonalizedRecommendations() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: async () => {
      // 1. Fetch user's primary pet
      const { data: pet } = user ? await supabase
        .from("pets")
        .select("name, species")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .maybeSingle() : { data: null };

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

      const processItems = (items: Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }> | null, weight: number, exclude: boolean = true) => {
        items?.forEach((item) => {
          if (exclude) {
            viewedProductIds.add(item.product_id);
          }
          if (item.products?.category_id) {
            categoryPrefs[item.products.category_id] = (categoryPrefs[item.products.category_id] || 0) + weight;
          }
          if (item.products?.collection_id) {
            collectionPrefs[item.products.collection_id] = (collectionPrefs[item.products.collection_id] || 0) + weight;
          }
        });
      };

      processItems(ordersRes.data as Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }>, 3, true);
      processItems(viewedRes.data as Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }>, 1, false);
      processItems(wishlistRes.data as Array<{ product_id: string; products: { category_id: string | null; collection_id: string | null } | null }>, 2, false);

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
      // Fetch a larger pool to filter by species if needed
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(50); 

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
        // Fallback to best sellers and new arrivals for new users (ensure we get enough items)
        query = query.or("is_best_seller.eq.true,is_new_arrival.eq.true,is_featured.eq.true");
      }

      const { data: products, error } = await query;

      if (error) throw error;

      let filtered = products?.filter(p => !viewedProductIds.has(p.id)) || [];

      // SPECIES FILTERING LOGIC
      if (pet) {
        const species = pet.species.toLowerCase();
        // keyword matching
        const speciesMatches = filtered.filter(p => {
          const text = (p.name + " " + (p.description || "")).toLowerCase();
          return text.includes(species);
        });

        // If we found matches, prioritize them. 
        if (speciesMatches.length > 0) {
          filtered = speciesMatches;
        }
        // If NO matches found, we keep the original 'filtered' list based on history/popularity
        // This ensures we show *something* instead of nothing.
      }

      // If not enough, add some best sellers (filtered by species if pet exists)
      if (filtered.length < 4) {
        const { data: fallback } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          //.eq("is_best_seller", true) // Removed restrictive filter to ensure we get results
          .order("is_best_seller", { ascending: false }) // Prioritize best sellers but allow others
          .limit(20); 

        const existingIds = new Set(filtered.map(p => p.id));
        
        fallback?.forEach(p => {
           if (!existingIds.has(p.id) && !viewedProductIds.has(p.id)) {
              filtered.push(p); // Just add them to fill the list
           }
        });
      }

      return { products: filtered.slice(0, 8), petName: pet?.name };
    },
    staleTime: 5 * 60 * 1000,
  });

  const recommendations = data?.products || [];
  const petName = data?.petName;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const updateScrollButtons = () => {
      const maxScrollLeft = Math.max(
        container.scrollWidth - container.clientWidth,
        0,
      );

      setCanScrollPrev(container.scrollLeft > 8);
      setCanScrollNext(container.scrollLeft < maxScrollLeft - 8);
    };

    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [recommendations.length]);

  const scrollRecommendations = (direction: "prev" | "next") => {
    const container = scrollContainerRef.current;

    if (!container) return;

    const scrollAmount = Math.max(container.clientWidth * 0.72, 260);

    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-muted/30">
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
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {petName ? `Selected for ${petName}` : "Just For You"}
            </p>
          </div>
          <h2 className="font-display text-3xl font-medium">
            Recommended For You
          </h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            {petName 
              ? `Handpicked styles we think ${petName} will love`
              : "Handpicked styles based on your preferences and browsing history"
            }
          </p>
        </div>

        <div className="group/recommendations relative">
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-24 items-center bg-gradient-to-r from-background via-background/95 to-transparent transition-opacity duration-200 lg:flex ${
              canScrollPrev
                ? "opacity-0 lg:group-hover/recommendations:opacity-100"
                : "opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={() => scrollRecommendations("prev")}
              disabled={!canScrollPrev}
              className="pointer-events-auto ml-3 flex h-12 w-12 items-center justify-center text-black transition-all duration-200 hover:scale-110 lg:-translate-x-2 lg:group-hover/recommendations:translate-x-0 disabled:pointer-events-none disabled:opacity-0"
              aria-label="Scroll recommendations left"
            >
              <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>

          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-24 items-center justify-end bg-gradient-to-l from-background via-background/95 to-transparent transition-opacity duration-200 lg:flex ${
              canScrollNext
                ? "opacity-0 lg:group-hover/recommendations:opacity-100"
                : "opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={() => scrollRecommendations("next")}
              disabled={!canScrollNext}
              className="pointer-events-auto mr-3 flex h-12 w-12 items-center justify-center text-black transition-all duration-200 hover:scale-110 lg:translate-x-2 lg:group-hover/recommendations:translate-x-0 disabled:pointer-events-none disabled:opacity-0"
              aria-label="Scroll recommendations right"
            >
              <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 scroll-smooth sm:mx-0 sm:px-0"
          >
            {recommendations.map((product) => (
              <div
                key={product.id}
                className="min-w-[200px] max-w-[200px] snap-center"
              >
                <ProductCard product={product as Product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
