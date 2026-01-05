import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_item_id: string | null;
  user_id: string;
  reason: string;
  description: string | null;
  status: string;
  refund_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useReturns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["returns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("return_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ReturnRequest[];
    },
    enabled: !!user,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      orderId,
      orderItemId,
      reason,
      description,
    }: {
      orderId: string;
      orderItemId?: string;
      reason: string;
      description?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("return_requests")
        .insert({
          order_id: orderId,
          order_item_id: orderItemId || null,
          user_id: user.id,
          reason,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast.success("Return request submitted", {
        description: "We'll review your request within 24-48 hours.",
      });
    },
    onError: () => {
      toast.error("Failed to submit return request");
    },
  });
}

export function useAdminReturns() {
  return useQuery({
    queryKey: ["admin-returns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("return_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ReturnRequest[];
    },
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnId,
      status,
      adminNotes,
      refundAmount,
    }: {
      returnId: string;
      status: string;
      adminNotes?: string;
      refundAmount?: number;
    }) => {
      const { error } = await supabase
        .from("return_requests")
        .update({
          status,
          admin_notes: adminNotes || null,
          refund_amount: refundAmount || null,
        })
        .eq("id", returnId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      toast.success("Return status updated");
    },
    onError: () => {
      toast.error("Failed to update return status");
    },
  });
}
