import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, getAuthenticatedUser, isAdminUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type AbandonedCartAction = "track" | "clear" | "recover";

interface AbandonedCartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface ManageAbandonedCartRequest {
  action: AbandonedCartAction;
  userId?: string | null;
  sessionId?: string | null;
  email?: string | null;
  cart_items?: AbandonedCartItem[];
  cart_total?: number;
  orderId?: string;
}

function sanitizeCartItems(items: AbandonedCartItem[]) {
  return items.slice(0, 50).map((item) => ({
    product_id: String(item.product_id ?? "").slice(0, 128),
    product_name: String(item.product_name ?? "").slice(0, 255),
    quantity: Math.max(1, Math.min(Number(item.quantity ?? 1), 99)),
    price: Math.max(0, Number(item.price ?? 0)),
    image_url:
      typeof item.image_url === "string" && item.image_url.length <= 2048
        ? item.image_url
        : undefined,
  }));
}

async function findActiveCartId(
  supabase: ReturnType<typeof createServiceClient>,
  {
    userId,
    sessionId,
  }: {
    userId?: string | null;
    sessionId?: string | null;
  },
) {
  if (!userId && !sessionId) return null;

  let query = supabase
    .from("abandoned_carts")
    .select("id")
    .is("recovered_at", null)
    .order("abandoned_at", { ascending: false })
    .limit(1);

  if (userId && sessionId) {
    query = query.or(`user_id.eq.${userId},session_id.eq.${sessionId}`);
  } else if (userId) {
    query = query.eq("user_id", userId);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const user = await getAuthenticatedUser(req);

    const {
      action,
      userId,
      sessionId,
      email,
      cart_items = [],
      cart_total = 0,
      orderId,
    }: ManageAbandonedCartRequest = await req.json();

    if (!action || !["track", "clear", "recover"].includes(action)) {
      throw new Error("Missing action");
    }

    if (!userId && !sessionId) {
      throw new Error("Missing cart identity");
    }

    if (sessionId && sessionId.length > 128) {
      throw new Error("Invalid cart session");
    }

    if (userId && !user) {
      return jsonResponse({ success: false, error: "Authentication required" }, 401);
    }

    if (userId && user) {
      const admin = await isAdminUser(user.id, supabase);
      if (!admin && user.id !== userId) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }
    }

    if (action === "recover" && !user) {
      return jsonResponse({ success: false, error: "Authentication required" }, 401);
    }

    const sanitizedEmail =
      typeof email === "string" && email.includes("@") && email.length <= 320
        ? email
        : null;
    const sanitizedCartItems = sanitizeCartItems(cart_items);
    const sanitizedCartTotal = Math.max(0, Number(cart_total ?? 0));

    const activeCartId = await findActiveCartId(supabase, {
      userId,
      sessionId,
    });

    if (action === "track") {
      const payload = {
        user_id: userId || null,
        session_id: sessionId || null,
        email: sanitizedEmail,
        cart_items: sanitizedCartItems,
        cart_total: sanitizedCartTotal,
        abandoned_at: new Date().toISOString(),
      };

      const { error } = activeCartId
        ? await supabase
            .from("abandoned_carts")
            .update(payload)
            .eq("id", activeCartId)
            .is("recovered_at", null)
        : await supabase.from("abandoned_carts").insert(payload);

      if (error) throw error;

      return jsonResponse({ success: true, action, cartId: activeCartId ?? null }, 200);
    }

    if (!activeCartId) {
      return jsonResponse({ success: true, action, cartId: null }, 200);
    }

    if (action === "clear") {
      const { error } = await supabase
        .from("abandoned_carts")
        .delete()
        .eq("id", activeCartId)
        .is("recovered_at", null);

      if (error) throw error;
    }

    if (action === "recover") {
      if (!orderId) {
        throw new Error("Missing orderId for recover action");
      }

      const { error } = await supabase
        .from("abandoned_carts")
        .update({
          recovered_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq("id", activeCartId)
        .is("recovered_at", null);

      if (error) throw error;
    }

    return jsonResponse({ success: true, action, cartId: activeCartId }, 200);
  } catch (error: unknown) {
    console.error("manage-abandoned-cart error:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
};

serve(handler);
