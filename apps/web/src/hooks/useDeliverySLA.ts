import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";

export interface DeliverySLA {
  id: string;
  order_id: string;
  promised_delivery_date: string;
  actual_delivery_date: string | null;
  sla_met: boolean | null;
  delay_hours: number | null;
  delay_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useDeliverySLAStats() {
  return useQuery({
    queryKey: ["delivery-sla-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_sla")
        .select("*");

      if (error) throw error;

      const slaData = data as DeliverySLA[];
      const total = slaData.length;
      const completed = slaData.filter((s) => s.actual_delivery_date).length;
      const onTime = slaData.filter((s) => s.sla_met === true).length;
      const delayed = slaData.filter((s) => s.sla_met === false).length;
      const pending = slaData.filter((s) => s.sla_met === null).length;

      const avgDelayHours =
        slaData.filter((s) => s.delay_hours).reduce((sum, s) => sum + (s.delay_hours || 0), 0) /
          (delayed || 1);

      const delayReasons = slaData
        .filter((s) => s.delay_reason)
        .reduce((acc, s) => {
          acc[s.delay_reason!] = (acc[s.delay_reason!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      return {
        total,
        completed,
        onTime,
        delayed,
        pending,
        slaRate: total > 0 ? ((onTime / completed) * 100).toFixed(1) : "0",
        avgDelayHours: avgDelayHours.toFixed(1),
        delayReasons,
        recentSLAs: slaData.slice(0, 20),
      };
    },
  });
}

export function useCreateDeliverySLA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      promisedDeliveryDate,
    }: {
      orderId: string;
      promisedDeliveryDate: string;
    }) => {
      const { data, error } = await supabase
        .from("delivery_sla")
        .insert({
          order_id: orderId,
          promised_delivery_date: promisedDeliveryDate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-sla-stats"] });
    },
  });
}

export function useUpdateDeliverySLA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slaId,
      actualDeliveryDate,
      delayReason,
    }: {
      slaId: string;
      actualDeliveryDate: string;
      delayReason?: string;
    }) => {
      // First get the SLA record to calculate if it was met
      const { data: sla, error: fetchError } = await supabase
        .from("delivery_sla")
        .select("promised_delivery_date")
        .eq("id", slaId)
        .single();

      if (fetchError) throw fetchError;

      const promised = new Date(sla.promised_delivery_date);
      const actual = new Date(actualDeliveryDate);
      const slaMet = actual <= promised;
      const delayHours = slaMet ? 0 : (actual.getTime() - promised.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from("delivery_sla")
        .update({
          actual_delivery_date: actualDeliveryDate,
          sla_met: slaMet,
          delay_hours: delayHours,
          delay_reason: delayReason,
        })
        .eq("id", slaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-sla-stats"] });
      toast.success("Delivery SLA updated");
    },
    onError: () => {
      toast.error("Failed to update SLA");
    },
  });
}
