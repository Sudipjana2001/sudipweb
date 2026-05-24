import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecentlyViewedItem {
  id: string;
  user_id: string;
  product_id: string;
  viewed_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  };
}

export function useRecentlyViewed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recently-viewed", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("recently_viewed")
        .select(`
          *,
          product:products(id, name, slug, price, image_url)
        `)
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as RecentlyViewedItem[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTrackProductView() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) return null;

      const { error } = await supabase
        .from("recently_viewed")
        .upsert(
          {
            user_id: user.id,
            product_id: productId,
            viewed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,product_id",
          },
        );

      if (error) throw error;
    },
    // Listing is updated on next navigation; invalidating here caused refetch loops on the product page.
  });
}
