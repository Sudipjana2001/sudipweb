import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  gateway_response: Record<string, unknown> | null;
  refund_amount: number;
  refund_status: string | null;
  refund_processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });
}

export function useAllPayments() {
  return useQuery({
    queryKey: ["all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useCreatePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      amount,
      paymentMethod,
      transactionId,
    }: {
      orderId: string;
      amount: number;
      paymentMethod: string;
      transactionId?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("payments")
        .insert({
          order_id: orderId,
          user_id: user.id,
          amount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "processing",
          transaction_id: transactionId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      status,
      transactionId,
    }: {
      paymentId: string;
      status: string;
      transactionId?: string;
    }) => {
      const updateData: Record<string, unknown> = { payment_status: status };
      if (transactionId) updateData.transaction_id = transactionId;

      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      toast.success("Payment status updated");
    },
    onError: () => {
      toast.error("Failed to update payment status");
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentId,
      refundAmount,
    }: {
      paymentId: string;
      refundAmount: number;
    }) => {
      const { error } = await supabase
        .from("payments")
        .update({
          refund_amount: refundAmount,
          refund_status: "processed",
          refund_processed_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      toast.success("Refund processed successfully");
    },
    onError: () => {
      toast.error("Failed to process refund");
    },
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*");

      if (error) throw error;

      const totalRevenue = payments
        .filter((p) => p.payment_status === "completed")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalRefunds = payments.reduce(
        (sum, p) => sum + (p.refund_amount || 0),
        0
      );

      const pendingPayments = payments.filter(
        (p) => p.payment_status === "pending"
      ).length;

      const completedPayments = payments.filter(
        (p) => p.payment_status === "completed"
      ).length;

      const methodBreakdown = payments.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        pendingPayments,
        completedPayments,
        totalPayments: payments.length,
        methodBreakdown,
      };
    },
  });
}
