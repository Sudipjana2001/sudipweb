import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface InfluencerProfile {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  follower_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useInfluencers() {
  return useQuery({
    queryKey: ["influencers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("is_active", true)
        .order("follower_count", { ascending: false });

      if (error) throw error;
      return data as InfluencerProfile[];
    },
  });
}

export function useMyInfluencerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-influencer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as InfluencerProfile | null;
    },
    enabled: !!user,
  });
}

export function useCreateInfluencerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      handle: string;
      display_name: string;
      bio?: string;
      instagram_url?: string;
      tiktok_url?: string;
      youtube_url?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("influencer_profiles")
        .insert({
          user_id: user.id,
          ...profile,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      queryClient.invalidateQueries({ queryKey: ["my-influencer-profile"] });
      toast.success("Influencer profile created!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInfluencerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<InfluencerProfile> & { id: string }) => {
      const { error } = await supabase
        .from("influencer_profiles")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      queryClient.invalidateQueries({ queryKey: ["my-influencer-profile"] });
      toast.success("Profile updated");
    },
  });
}

export function useTagInfluencer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      galleryPostId,
      influencerId,
    }: {
      galleryPostId: string;
      influencerId: string | null;
    }) => {
      const { error } = await supabase
        .from("pet_gallery")
        .update({ influencer_id: influencerId })
        .eq("id", galleryPostId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Influencer tagged");
    },
  });
}
