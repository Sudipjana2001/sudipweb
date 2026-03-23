import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";

const ABANDONED_CART_SESSION_KEY = "abandoned_cart_session_id";

export interface AbandonedCartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

export interface AbandonedCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  email: string | null;
  cart_items: AbandonedCartItem[];
  cart_total: number;
  abandoned_at: string;
  recovered_at: string | null;
  recovery_email_sent: boolean;
  order_id: string | null;
  created_at: string;
}

interface AbandonedCartIdentity {
  userId?: string | null;
  sessionId?: string | null;
}

interface TrackAbandonedCartInput extends AbandonedCartIdentity {
  email?: string;
  cart_items: AbandonedCartItem[];
  cart_total: number;
}

function createSessionId() {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto?.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAbandonedCartSessionId() {
  if (typeof window === "undefined") return null;

  const existing = sessionStorage.getItem(ABANDONED_CART_SESSION_KEY);
  if (existing) return existing;

  const nextSessionId = createSessionId();
  sessionStorage.setItem(ABANDONED_CART_SESSION_KEY, nextSessionId);
  return nextSessionId;
}

export async function clearTrackedAbandonedCart({
  userId,
  sessionId,
}: AbandonedCartIdentity) {
  const { data, error } = await supabase.functions.invoke(
    "manage-abandoned-cart",
    {
      body: {
        action: "clear",
        userId: userId || null,
        sessionId: sessionId || null,
      },
    },
  );

  if (error) throw error;
  if (data?.success === false) {
    throw new Error(data.error || "Failed to clear abandoned cart.");
  }
}

export async function trackAbandonedCartSnapshot(
  cart: TrackAbandonedCartInput,
) {
  const sessionId = cart.sessionId || getAbandonedCartSessionId();
  const { data, error } = await supabase.functions.invoke(
    "manage-abandoned-cart",
    {
      body: {
        action: "track",
        userId: cart.userId || null,
        sessionId,
        email: cart.email || null,
        cart_items: cart.cart_items,
        cart_total: cart.cart_total,
      },
    },
  );

  if (error) throw error;
  if (data?.success === false) {
    throw new Error(data.error || "Failed to track abandoned cart.");
  }
}

export async function markTrackedAbandonedCartRecovered({
  userId,
  sessionId,
  orderId,
}: AbandonedCartIdentity & { orderId: string }) {
  const { data, error } = await supabase.functions.invoke(
    "manage-abandoned-cart",
    {
      body: {
        action: "recover",
        userId: userId || null,
        sessionId: sessionId || null,
        orderId,
      },
    },
  );

  if (error) throw error;
  if (data?.success === false) {
    throw new Error(data.error || "Failed to mark abandoned cart recovered.");
  }
}

function buildRecoveryEmailHtml(cart: AbandonedCart) {
  const cartItemsHtml = cart.cart_items
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${item.product_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const cartUrl =
    typeof window !== "undefined" ? `${window.location.origin}/cart` : "/cart";

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h2 style="margin-bottom:12px;">You left something behind at Pebric</h2>
      <p style="margin:0 0 16px;">Your cart is still waiting for you.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="padding:0 0 8px;text-align:left;border-bottom:2px solid #111827;">Item</th>
            <th style="padding:0 12px 8px;text-align:center;border-bottom:2px solid #111827;">Qty</th>
            <th style="padding:0 0 8px;text-align:right;border-bottom:2px solid #111827;">Total</th>
          </tr>
        </thead>
        <tbody>${cartItemsHtml}</tbody>
      </table>
      <p style="margin:0 0 20px;font-weight:600;">Cart total: ₹${cart.cart_total.toFixed(2)}</p>
      <a
        href="${cartUrl}"
        style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;"
      >
        Return to your cart
      </a>
      <p style="margin:20px 0 0;color:#6b7280;font-size:14px;">
        If you've already completed your purchase, you can ignore this email.
      </p>
    </div>
  `;
}

export function useAbandonedCarts() {
  return useQuery({
    queryKey: ["abandoned-carts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .is("recovered_at", null)
        .order("abandoned_at", { ascending: false });

      if (error) throw error;
      return data as AbandonedCart[];
    },
  });
}

export function useAbandonedCartStats() {
  return useQuery({
    queryKey: ["abandoned-cart-stats"],
    queryFn: async () => {
      const { data: all, error: allError } = await supabase
        .from("abandoned_carts")
        .select("id, cart_total, recovered_at");

      if (allError) throw allError;

      const total = all?.length || 0;
      const recovered = all?.filter((c) => c.recovered_at).length || 0;
      const totalValue =
        all?.reduce((sum, c) => sum + Number(c.cart_total), 0) || 0;
      const recoveredValue =
        all
          ?.filter((c) => c.recovered_at)
          .reduce((sum, c) => sum + Number(c.cart_total), 0) || 0;

      return {
        totalAbandoned: total,
        recoveredCount: recovered,
        recoveryRate: total > 0 ? ((recovered / total) * 100).toFixed(1) : "0",
        totalLostValue: totalValue - recoveredValue,
        recoveredValue,
      };
    },
  });
}

export function useMarkCartRecovered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartId,
      orderId,
    }: {
      cartId: string;
      orderId: string;
    }) => {
      const { error } = await supabase
        .from("abandoned_carts")
        .update({
          recovered_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq("id", cartId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      queryClient.invalidateQueries({ queryKey: ["abandoned-cart-stats"] });
      toast.success("Cart marked as recovered");
    },
  });
}

export function useTrackAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackAbandonedCartSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      queryClient.invalidateQueries({ queryKey: ["abandoned-cart-stats"] });
    },
  });
}

export function useClearTrackedAbandonedCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearTrackedAbandonedCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      queryClient.invalidateQueries({ queryKey: ["abandoned-cart-stats"] });
    },
  });
}

export function useSendAbandonedCartRecoveryEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cart: AbandonedCart) => {
      if (!cart.email) {
        throw new Error("This cart does not have an email address.");
      }

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: cart.email,
          from: "Pebric <onboarding@resend.dev>",
          subject: "You left something behind at Pebric",
          html: buildRecoveryEmailHtml(cart),
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to send recovery email.");
      }

      if (data?.success !== true) {
        throw new Error(
          data?.message || data?.error || "Failed to send recovery email.",
        );
      }

      const { error: updateError } = await supabase
        .from("abandoned_carts")
        .update({ recovery_email_sent: true })
        .eq("id", cart.id);

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      toast.success("Recovery email sent");
    },
    onError: (error) => {
      toast.error("Failed to send recovery email", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}
