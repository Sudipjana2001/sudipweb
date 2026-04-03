import { supabase } from "@/integrations/client";

type RateLimitEndpoint =
  | "review-submit"
  | "support-ticket"
  | "send-email"
  | "default";

type RateLimitResponse = {
  allowed?: boolean;
  remaining?: number;
  retryAfter?: number;
  message?: string;
  error?: string;
};

type FunctionsHttpErrorLike = {
  context?: Response;
  message?: string;
};

export async function enforceRateLimit(endpoint: RateLimitEndpoint) {
  const { data, error } = await supabase.functions.invoke("check-rate-limit", {
    body: { endpoint },
  });

  const result = data as RateLimitResponse | null;

  if (result?.allowed === false) {
    throw new Error(result.message || "Too many requests. Please try again later.");
  }

  if (error) {
    const status = (error as FunctionsHttpErrorLike).context?.status;
    if (status === 429) {
      throw new Error(
        result?.message || "Too many requests. Please wait and try again.",
      );
    }

    console.warn("Rate limit check failed open:", error);
  }
}
