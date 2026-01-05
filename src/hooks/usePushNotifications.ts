import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePushSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscribeToNotifications = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications not supported");
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = urlBase64ToUint8Array(
        // This would be your VAPID public key - placeholder for now
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys?.p256dh!,
        auth: subscriptionJson.keys?.auth!,
      });

      if (error) throw error;
      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      toast.success("Push notifications enabled!");
    },
    onError: (error) => {
      toast.error(`Failed to enable notifications: ${error.message}`);
    },
  });

  const unsubscribeFromNotifications = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      toast.success("Push notifications disabled");
    },
  });

  const checkSubscription = useQuery({
    queryKey: ["push-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    isSubscribed: !!checkSubscription.data,
    subscribe: subscribeToNotifications,
    unsubscribe: unsubscribeFromNotifications,
    isLoading: checkSubscription.isLoading,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
