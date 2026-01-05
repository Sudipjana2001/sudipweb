import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type FitRating = "too_tight" | "slightly_tight" | "perfect" | "slightly_loose" | "too_loose";

export interface FitFeedback {
  id: string;
  user_id: string;
  order_item_id: string | null;
  product_id: string;
  pet_id: string | null;
  fit_rating: FitRating;
  size_purchased: string | null;
  would_recommend_size: string | null;
  comments: string | null;
  created_at: string;
}

export function useFitFeedback(productId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["fit-feedback", productId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("fit_feedback")
        .select("*")
        .eq("user_id", user.id);
        
      if (productId) {
        query = query.eq("product_id", productId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as FitFeedback[];
    },
    enabled: !!user,
  });
}

export function useSubmitFitFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      orderItemId,
      petId,
      fitRating,
      sizePurchased,
      wouldRecommendSize,
      comments,
    }: {
      productId: string;
      orderItemId?: string;
      petId?: string;
      fitRating: FitRating;
      sizePurchased?: string;
      wouldRecommendSize?: string;
      comments?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("fit_feedback")
        .insert({
          user_id: user.id,
          product_id: productId,
          order_item_id: orderItemId || null,
          pet_id: petId || null,
          fit_rating: fitRating,
          size_purchased: sizePurchased || null,
          would_recommend_size: wouldRecommendSize || null,
          comments: comments || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fit-feedback"] });
      toast.success("Thank you for your feedback!", {
        description: "Your input helps other pet parents find the perfect fit.",
      });
    },
    onError: (error) => {
      toast.error("Failed to submit feedback", { description: error.message });
    },
  });
}

// Admin hook for analytics
export function useFitFeedbackAnalytics(productId?: string) {
  return useQuery({
    queryKey: ["fit-feedback-analytics", productId],
    queryFn: async () => {
      let query = supabase
        .from("fit_feedback")
        .select("fit_rating, size_purchased, would_recommend_size, product_id");
        
      if (productId) {
        query = query.eq("product_id", productId);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      // Aggregate the data
      const ratings: Record<FitRating, number> = {
        too_tight: 0,
        slightly_tight: 0,
        perfect: 0,
        slightly_loose: 0,
        too_loose: 0,
      };

      data.forEach((item) => {
        if (item.fit_rating in ratings) {
          ratings[item.fit_rating as FitRating]++;
        }
      });

      return {
        total: data.length,
        ratings,
        perfectFitPercentage: data.length > 0 ? (ratings.perfect / data.length) * 100 : 0,
      };
    },
  });
}
