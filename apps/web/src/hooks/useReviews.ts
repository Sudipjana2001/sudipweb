import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fromTable } from "@/lib/supabaseUntyped";
import { enforceRateLimit } from "@/lib/rateLimit";
import { REVIEW_SUMMARY_QUERY_OPTIONS } from "@/lib/queryCache";

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  photos: string[];
  is_verified_purchase: boolean;
  author_name?: string | null;
  author_avatar_url?: string | null;
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

export function useProductReviewSummary(productId: string) {
  return useQuery({
    queryKey: ["reviews", "summary", productId],
    queryFn: async () => {
      const rpcClient = supabase as unknown as {
        rpc: (
          fn: string,
          args?: Record<string, unknown>,
        ) => Promise<{
          data:
            | { average_rating: number | null; total_reviews: number | null }[]
            | null;
          error: { message: string } | null;
        }>;
      };
      const { data, error } = await rpcClient.rpc("get_review_summary", {
        p_product_id: productId,
      });

      if (error) throw error;

      const summary = data?.[0];

      return {
        averageRating: summary?.average_rating ?? 0,
        totalReviews: summary?.total_reviews ?? 0,
      };
    },
    enabled: !!productId,
    ...REVIEW_SUMMARY_QUERY_OPTIONS,
  });
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

      // Fetch user's votes if authenticated
      let userVotes = new Set<string>();
      if (user && reviews.length > 0) {
        const { data: votes } = await supabase
          .from("review_helpful_votes")
          .select("review_id")
          .eq("user_id", user.id)
          .in("review_id", reviews.map(r => r.id));
        
        userVotes = new Set(votes?.map(v => v.review_id) || []);
      }

      return reviews.map(review => ({
        ...review,
        profiles: null,
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
          queryClient.invalidateQueries({
            queryKey: ["reviews", "summary", productId],
          });
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
      await enforceRateLimit("review-submit");

      // Check if user has a delivered order for this product
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, orders!inner(user_id,status)")
        .eq("product_id", review.product_id)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered")
        .limit(1);

      const isVerified = (orderItems?.length ?? 0) > 0;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const authorName =
        profile?.full_name ??
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
        user.email ??
        null;

      const { data, error } = await fromTable("reviews")
        .insert({
          ...review,
          user_id: user.id,
          is_verified_purchase: isVerified,
          photos: review.photos || [],
          author_name: authorName,
          author_avatar_url: profile?.avatar_url ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.product_id] });
      queryClient.invalidateQueries({
        queryKey: ["reviews", "summary", variables.product_id],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["reviews", "summary", result.product_id],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["reviews", "summary", result.product_id],
      });
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

      const rpcClient = supabase as unknown as {
        rpc: (
          fn: string,
          args?: Record<string, unknown>,
        ) => Promise<{ data: number | null; error: { message: string } | null }>;
      };

      const { data, error } = await rpcClient.rpc("mark_review_helpful", {
        p_review_id: id,
      });

      if (error) throw new Error(error.message);

      return {
        product_id,
        helpfulCount: data ?? null,
      };
    },
    onMutate: async ({ id, product_id }) => {
      await queryClient.cancelQueries({ queryKey: ["reviews", product_id] });

      const previousReviewQueries =
        queryClient.getQueriesData<ReviewWithUser[]>({
          queryKey: ["reviews", product_id],
        });

      queryClient.setQueriesData<ReviewWithUser[]>(
        { queryKey: ["reviews", product_id] },
        (currentReviews) =>
          currentReviews?.map((review) =>
            review.id === id
              ? {
                  ...review,
                  helpful_count: review.helpful_count + 1,
                  user_has_voted: true,
                }
              : review,
          ),
      );

      return { previousReviewQueries };
    },
    onSuccess: ({ product_id, helpfulCount }, variables) => {
      if (typeof helpfulCount === "number") {
        queryClient.setQueriesData<ReviewWithUser[]>(
          { queryKey: ["reviews", product_id] },
          (currentReviews) =>
            currentReviews?.map((review) =>
              review.id === variables.id
                ? {
                    ...review,
                    helpful_count: helpfulCount,
                    user_has_voted: true,
                  }
                : review,
            ),
        );
      }
      toast.success("Thanks for your feedback!");
    },
    onError: (error: Error, _variables, context) => {
      context?.previousReviewQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
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
