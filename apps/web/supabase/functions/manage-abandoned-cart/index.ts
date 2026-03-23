import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

async function findActiveCartId(
  supabase: ReturnType<typeof createClient>,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      action,
      userId,
      sessionId,
      email,
      cart_items = [],
      cart_total = 0,
      orderId,
    }: ManageAbandonedCartRequest = await req.json();

    if (!action) {
      throw new Error("Missing action");
    }

    if (!userId && !sessionId) {
      throw new Error("Missing cart identity");
    }

    const activeCartId = await findActiveCartId(supabase, {
      userId,
      sessionId,
    });

    if (action === "track") {
      const payload = {
        user_id: userId || null,
        session_id: sessionId || null,
        email: email || null,
        cart_items,
        cart_total,
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

      return new Response(
        JSON.stringify({ success: true, action, cartId: activeCartId ?? null }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!activeCartId) {
      return new Response(
        JSON.stringify({ success: true, action, cartId: null }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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

    return new Response(
      JSON.stringify({ success: true, action, cartId: activeCartId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("manage-abandoned-cart error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);
