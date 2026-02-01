import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  user_has_voted?: boolean;
}

export interface ReviewWithUser extends Review {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  user_has_voted?: boolean;
}

export function useProductReviews(productId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reviews", productId, user?.id],
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

      // Fetch user's votes if authenticated
      let userVotes = new Set<string>();
      if (user) {
        const { data: votes } = await supabase
          .from("review_helpful_votes")
          .select("review_id")
          .eq("user_id", user.id)
          .in("review_id", reviews.map(r => r.id));
        
        userVotes = new Set(votes?.map(v => v.review_id) || []);
      }

      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null,
        user_has_voted: userVotes.has(review.id),
      })) as ReviewWithUser[];
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`reviews-realtime-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `product_id=eq.${productId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient]);

  return query;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Get the review to check the author
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .select("user_id, helpful_count")
        .eq("id", id)
        .single();

      if (reviewError) throw reviewError;

      // Prevent author from voting on their own review
      if (review.user_id === user.id) {
        throw new Error("You cannot vote on your own review");
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from("review_helpful_votes")
        .select("id")
        .eq("review_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingVote) {
        throw new Error("You have already voted on this review");
      }

      // Insert the vote
      const { error: voteError } = await supabase
        .from("review_helpful_votes")
        .insert({ review_id: id, user_id: user.id });

      if (voteError) throw voteError;

      // Increment the helpful count
      const { error: updateError } = await supabase
        .from("reviews")
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq("id", id);

      if (updateError) throw updateError;

      return { product_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", result.product_id] });
      toast.success("Thanks for your feedback!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
