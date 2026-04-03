import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, getAuthenticatedUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

interface RateLimitRequest {
  endpoint: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retry_after: number;
}

const rateLimitConfig: Record<string, { maxRequests: number; windowMinutes: number }> = {
  "support-ticket": { maxRequests: 10, windowMinutes: 10 },
  "review-submit": { maxRequests: 10, windowMinutes: 10 },
  "send-email": { maxRequests: 5, windowMinutes: 10 },
  "default": { maxRequests: 60, windowMinutes: 1 },
};

function getClientIdentifier(req: Request, userId?: string) {
  if (userId) return `user:${userId}`;

  const forwardedFor = req.headers.get("x-forwarded-for");
  const cfIp = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || cfIp || realIp;

  return ip ? `ip:${ip}` : "anonymous";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint }: RateLimitRequest = await req.json();
    const user = await getAuthenticatedUser(req);
    const supabase = createServiceClient();

    if (typeof endpoint !== "string" || !/^[a-z0-9:_-]{1,100}$/i.test(endpoint)) {
      return jsonResponse({ allowed: false, error: "Invalid endpoint" }, 400);
    }

    const { maxRequests, windowMinutes } = rateLimitConfig[endpoint] ?? rateLimitConfig.default;
    const identifier = getClientIdentifier(req, user?.id);

    const { data, error } = await supabase.rpc("check_rate_limit_and_increment", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    });

    if (error) {
      console.error("Rate limit RPC error:", error);
      return jsonResponse({ allowed: true, remaining: maxRequests }, 200);
    }

    const [result] = (data ?? []) as RateLimitResult[];

    if (!result) {
      return jsonResponse({ allowed: true, remaining: maxRequests }, 200);
    }

    if (!result.allowed) {
      console.log(`Rate limit exceeded for ${identifier} on ${endpoint}`);
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          retryAfter: result.retry_after,
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(result.retry_after),
          },
        },
      );
    }

    // Clean up old records periodically (1% chance)
    if (Math.random() < 0.01) {
      const cleanupTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("rate_limits").delete().lt("window_start", cleanupTime);
    }

    return jsonResponse(
      {
        allowed: true,
        remaining: result.remaining,
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Rate limit error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ allowed: true, error: errorMessage }, 200);
  }
};

serve(handler);
