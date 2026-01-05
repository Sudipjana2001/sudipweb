import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  photos: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
}

export interface ReviewWithUser extends Review {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null,
      })) as ReviewWithUser[];
    },
    enabled: !!productId,
  });
}

export function useUserReviews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          products:product_id (name, slug, image_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      rating: number;
      title?: string;
      content?: string;
      photos?: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if user has purchased this product
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, orders!inner(user_id)")
        .eq("product_id", review.product_id)
        .eq("orders.user_id", user.id)
        .limit(1);

      const isVerified = (orderItems?.length ?? 0) > 0;

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          ...review,
          user_id: user.id,
          is_verified_purchase: isVerified,
          photos: review.photos || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.product_id] });
      toast.success("Review submitted!");
    },
    onError: (error) => {
      toast.error("Failed to submit review", { description: error.message });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      product_id,
      ...updates
    }: Partial<Review> & { id: string; product_id: string }) => {
      const { data, error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, product_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", result.product_id] });
      toast.success("Review updated");
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      return { product_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", result.product_id] });
      toast.success("Review deleted");
    },
  });
}

export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { data: review } = await supabase
        .from("reviews")
        .select("helpful_count")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("reviews")
        .update({ helpful_count: (review?.helpful_count || 0) + 1 })
        .eq("id", id);

      if (error) throw error;
      return { product_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", result.product_id] });
    },
  });
}

export function getAverageRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function getRatingDistribution(reviews: Review[]): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });
  return distribution;
}
