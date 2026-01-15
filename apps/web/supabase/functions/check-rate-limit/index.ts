import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitRequest {
  identifier: string; // IP or user ID
  endpoint: string;
  maxRequests?: number;
  windowMinutes?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      identifier, 
      endpoint, 
      maxRequests = 60, 
      windowMinutes = 1 
    }: RateLimitRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Get current request count in the window
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("request_count")
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart)
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Rate limit fetch error:", fetchError);
      // Allow request if we can't check
      return new Response(
        JSON.stringify({ allowed: true, remaining: maxRequests }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentCount = existing?.request_count || 0;

    if (currentCount >= maxRequests) {
      console.log(`Rate limit exceeded for ${identifier} on ${endpoint}`);
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          remaining: 0,
          retryAfter: windowMinutes * 60,
          message: "Rate limit exceeded. Please try again later."
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(windowMinutes * 60)
          } 
        }
      );
    }

    // Increment or create the rate limit record
    if (existing) {
      await supabase
        .from("rate_limits")
        .update({ request_count: currentCount + 1 })
        .eq("identifier", identifier)
        .eq("endpoint", endpoint)
        .gte("window_start", windowStart);
    } else {
      await supabase.from("rate_limits").insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString(),
      });
    }

    // Clean up old records periodically (1% chance)
    if (Math.random() < 0.01) {
      const cleanupTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("rate_limits").delete().lt("window_start", cleanupTime);
    }

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        remaining: maxRequests - currentCount - 1 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Rate limit error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ allowed: true, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
