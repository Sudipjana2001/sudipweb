import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  target_audience: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  metric_date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  created_at: string;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaignMetrics(campaignId?: string) {
  return useQuery({
    queryKey: ["campaign-metrics", campaignId],
    queryFn: async () => {
      let query = supabase
        .from("campaign_metrics")
        .select("*")
        .order("metric_date", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CampaignMetric[];
    },
  });
}

export function useCampaignStats() {
  return useQuery({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .select("*");

      if (campaignError) throw campaignError;

      const { data: metrics, error: metricsError } = await supabase
        .from("campaign_metrics")
        .select("*");

      if (metricsError) throw metricsError;

      const typedCampaigns = campaigns as Campaign[];
      const typedMetrics = metrics as CampaignMetric[];

      const totalImpressions = typedMetrics.reduce((sum, m) => sum + m.impressions, 0);
      const totalClicks = typedMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const totalConversions = typedMetrics.reduce((sum, m) => sum + m.conversions, 0);
      const totalRevenue = typedMetrics.reduce((sum, m) => sum + Number(m.revenue), 0);
      const totalCost = typedMetrics.reduce((sum, m) => sum + Number(m.cost), 0);

      const activeCampaigns = typedCampaigns.filter((c) => c.status === "active").length;

      const campaignPerformance = typedCampaigns.map((campaign) => {
        const campaignMetrics = typedMetrics.filter((m) => m.campaign_id === campaign.id);
        return {
          ...campaign,
          totalImpressions: campaignMetrics.reduce((sum, m) => sum + m.impressions, 0),
          totalClicks: campaignMetrics.reduce((sum, m) => sum + m.clicks, 0),
          totalConversions: campaignMetrics.reduce((sum, m) => sum + m.conversions, 0),
          totalRevenue: campaignMetrics.reduce((sum, m) => sum + Number(m.revenue), 0),
          totalCost: campaignMetrics.reduce((sum, m) => sum + Number(m.cost), 0),
          ctr: campaignMetrics.reduce((sum, m) => sum + m.impressions, 0) > 0
            ? ((campaignMetrics.reduce((sum, m) => sum + m.clicks, 0) /
                campaignMetrics.reduce((sum, m) => sum + m.impressions, 0)) * 100).toFixed(2)
            : "0",
          roi: campaignMetrics.reduce((sum, m) => sum + Number(m.cost), 0) > 0
            ? (((campaignMetrics.reduce((sum, m) => sum + Number(m.revenue), 0) -
                campaignMetrics.reduce((sum, m) => sum + Number(m.cost), 0)) /
                campaignMetrics.reduce((sum, m) => sum + Number(m.cost), 0)) * 100).toFixed(2)
            : "0",
        };
      });

      return {
        totalCampaigns: typedCampaigns.length,
        activeCampaigns,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCost,
        overallCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0",
        overallROI: totalCost > 0 ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(2) : "0",
        campaignPerformance,
      };
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: {
      name: string;
      description?: string;
      campaign_type: string;
      start_date?: string;
      end_date?: string;
      budget?: number;
    }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          name: campaign.name,
          description: campaign.description,
          campaign_type: campaign.campaign_type,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: campaign.budget,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      toast.success("Campaign created");
    },
    onError: () => {
      toast.error("Failed to create campaign");
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      campaign_type,
      status,
      start_date,
      end_date,
      budget,
    }: Partial<Omit<Campaign, "target_audience">> & { id: string }) => {
      const { error } = await supabase
        .from("campaigns")
        .update({
          name,
          description,
          campaign_type,
          status,
          start_date,
          end_date,
          budget,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      toast.success("Campaign updated");
    },
  });
}

export function useAddCampaignMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metric: {
      campaign_id: string;
      metric_date: string;
      impressions?: number;
      clicks?: number;
      conversions?: number;
      revenue?: number;
      cost?: number;
    }) => {
      const { data, error } = await supabase
        .from("campaign_metrics")
        .upsert(metric, { onConflict: "campaign_id,metric_date" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
      toast.success("Metrics recorded");
    },
  });
}
