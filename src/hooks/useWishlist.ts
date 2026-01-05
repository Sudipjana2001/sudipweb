import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string | null;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    slug: string;
    category?: {
      name: string;
    } | null;
  };
}

export function useWishlistItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("wishlist_items")
        .select(`
          *,
          product:products(id, name, price, image_url, slug, category:categories(name))
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!user,
  });
}

export function useAddToWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("wishlist_items").insert({
        user_id: user.id,
        product_id: productId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist");
    },
    onError: () => {
      toast.error("Failed to add to wishlist");
    },
  });
}

export function useRemoveFromWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    },
  });
}

export function useIsInWishlist(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist", "check", user?.id, productId],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!productId,
  });
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if already in wishlist
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
        return { added: false };
      } else {
        const { error } = await supabase.from("wishlist_items").insert({
          user_id: user.id,
          product_id: productId,
        });

        if (error) throw error;
        return { added: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result.added ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to update wishlist");
    },
  });
}
