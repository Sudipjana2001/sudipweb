import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SatisfactionRating {
  id: string;
  user_id: string | null;
  order_id: string | null;
  ticket_id: string | null;
  rating: number;
  feedback: string | null;
  rating_type: "order" | "support" | "product" | "delivery";
  created_at: string;
}

export function useSatisfactionRatings() {
  return useQuery({
    queryKey: ["satisfaction-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("satisfaction_ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SatisfactionRating[];
    },
  });
}

export function useSatisfactionStats() {
  return useQuery({
    queryKey: ["satisfaction-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("satisfaction_ratings")
        .select("rating, rating_type");

      if (error) throw error;

      const ratings = data as SatisfactionRating[];
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
        : "0";

      const byType = ratings.reduce((acc, r) => {
        if (!acc[r.rating_type]) {
          acc[r.rating_type] = { count: 0, total: 0 };
        }
        acc[r.rating_type].count++;
        acc[r.rating_type].total += r.rating;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const typeAverages = Object.entries(byType).reduce((acc, [type, data]) => {
        acc[type] = (data.total / data.count).toFixed(1);
        return acc;
      }, {} as Record<string, string>);

      const promoters = ratings.filter((r) => r.rating >= 4).length;
      const detractors = ratings.filter((r) => r.rating <= 2).length;
      const nps = totalRatings > 0
        ? Math.round(((promoters - detractors) / totalRatings) * 100)
        : 0;

      return {
        totalRatings,
        averageRating: avgRating,
        typeAverages,
        nps,
        distribution: {
          5: ratings.filter((r) => r.rating === 5).length,
          4: ratings.filter((r) => r.rating === 4).length,
          3: ratings.filter((r) => r.rating === 3).length,
          2: ratings.filter((r) => r.rating === 2).length,
          1: ratings.filter((r) => r.rating === 1).length,
        },
      };
    },
  });
}

export function useCreateSatisfactionRating() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rating: {
      order_id?: string;
      ticket_id?: string;
      rating: number;
      feedback?: string;
      rating_type: SatisfactionRating["rating_type"];
    }) => {
      const { data, error } = await supabase
        .from("satisfaction_ratings")
        .insert({
          user_id: user?.id || null,
          order_id: rating.order_id || null,
          ticket_id: rating.ticket_id || null,
          rating: rating.rating,
          feedback: rating.feedback || null,
          rating_type: rating.rating_type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["satisfaction-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["satisfaction-stats"] });
      toast.success("Thank you for your feedback!");
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });
}
