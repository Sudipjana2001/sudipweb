import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireAdminUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAdminUser(req);

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - email sending disabled");
      return jsonResponse(
        {
          success: false,
          message: "Email service not configured. Add RESEND_API_KEY to enable.",
        },
        200,
      );
    }

    const { to, subject, html, from }: EmailRequest = await req.json();

    if (typeof to !== "string" || !to.includes("@") || to.length > 320) {
      return jsonResponse({ error: "A valid recipient email is required." }, 400);
    }

    if (typeof subject !== "string" || subject.trim().length === 0 || subject.length > 200) {
      return jsonResponse({ error: "A valid email subject is required." }, 400);
    }

    if (typeof html !== "string" || html.trim().length === 0 || html.length > 100_000) {
      return jsonResponse({ error: "A valid email body is required." }, 400);
    }

    console.log(`Sending email to ${to} with subject: ${subject}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || "PawParel <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    return jsonResponse({ success: true, ...result }, 200);
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage === "Authentication required" || errorMessage === "Admin access required"
      ? 403
      : 500;
    return jsonResponse({ error: errorMessage }, status);
  }
};

serve(handler);
