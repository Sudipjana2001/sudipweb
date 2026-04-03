import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, getAuthenticatedUser, isAdminUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

// Future: Configure alternative AI service credentials here
// Examples: OpenAI API Key, Google AI API Key, Azure OpenAI, etc.
const AI_SERVICE_API_KEY = Deno.env.get("AI_MODERATION_API_KEY");
const AI_SERVICE_ENDPOINT = Deno.env.get("AI_MODERATION_ENDPOINT");

interface ModerationRequest {
  imageUrl: string;
  galleryPostId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, galleryPostId }: ModerationRequest = await req.json();
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    if (typeof imageUrl !== "string" || imageUrl.trim().length === 0 || imageUrl.length > 2048) {
      return jsonResponse({ error: "A valid image URL is required" }, 400);
    }

    console.log(`Moderating image: ${imageUrl}`);

    const supabase = createServiceClient();
    const isAdmin = await isAdminUser(user.id, supabase);

    if (galleryPostId) {
      const { data: post, error: postError } = await supabase
        .from("pet_gallery")
        .select("id, user_id")
        .eq("id", galleryPostId)
        .maybeSingle();

      if (postError) {
        console.error("Failed to load gallery post for moderation:", postError);
        return jsonResponse({ error: "Failed to load gallery post" }, 500);
      }

      if (!post) {
        return jsonResponse({ error: "Gallery post not found" }, 404);
      }

      if (!isAdmin && post.user_id !== user.id) {
        return jsonResponse({ error: "You cannot moderate this gallery post" }, 403);
      }
    }

    if (!AI_SERVICE_API_KEY || !AI_SERVICE_ENDPOINT) {
      console.log("AI moderation service not configured - leaving image pending review");

      const pendingResult = {
        approved: false,
        reason: "Moderation pending manual review",
        confidence: 0,
      };

      if (galleryPostId) {
        await supabase.from("image_moderation_logs").insert({
          gallery_post_id: galleryPostId,
          image_url: imageUrl,
          moderation_result: pendingResult,
          is_approved: false,
          rejection_reason: pendingResult.reason,
        });

        await supabase
          .from("pet_gallery")
          .update({ is_approved: false })
          .eq("id", galleryPostId);
      }

      return jsonResponse(pendingResult, 200);
    }

    const moderationResult = {
      approved: false,
      reason: "Moderation pending manual review",
      confidence: 0,
    };

    if (galleryPostId) {
      await supabase.from("image_moderation_logs").insert({
        gallery_post_id: galleryPostId,
        image_url: imageUrl,
        moderation_result: moderationResult,
        is_approved: false,
        rejection_reason: moderationResult.reason,
      });

      await supabase
        .from("pet_gallery")
        .update({ is_approved: false })
        .eq("id", galleryPostId);
    }

    return jsonResponse(moderationResult, 200);
  } catch (error: unknown) {
    console.error("Moderation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: errorMessage, approved: false }, 500);
  }
};

serve(handler);
