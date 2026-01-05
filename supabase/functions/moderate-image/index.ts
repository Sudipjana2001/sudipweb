import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    console.log(`Moderating image: ${imageUrl}`);

    // Auto-approve if no AI moderation service is configured
    if (!AI_SERVICE_API_KEY || !AI_SERVICE_ENDPOINT) {
      console.log("AI moderation service not configured - auto-approving image");
      
      const autoApprovalResult = {
        approved: true,
        reason: "AI moderation service not configured - auto-approved",
        confidence: 1.0
      };

      // Log the auto-approval if we have a gallery post ID
      if (galleryPostId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("image_moderation_logs").insert({
          gallery_post_id: galleryPostId,
          image_url: imageUrl,
          moderation_result: autoApprovalResult,
          is_approved: true,
          rejection_reason: null,
        });

        // Update the gallery post approval status
        await supabase
          .from("pet_gallery")
          .update({ is_approved: true })
          .eq("id", galleryPostId);
      }

      return new Response(
        JSON.stringify(autoApprovalResult),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: Future AI service integration
    // When ready to integrate an AI moderation service:
    // 1. Set AI_MODERATION_API_KEY and AI_MODERATION_ENDPOINT environment variables
    // 2. Implement the API call below based on your chosen service
    // 3. Parse the response and extract moderation result
    
    // Example structure for future AI integration:
    /*
    const response = await fetch(AI_SERVICE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_SERVICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Configure based on your AI service's API
        image_url: imageUrl,
        prompt: "Analyze this image for inappropriate content..."
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI service error:", errorText);
      // Fallback to auto-approval on error
      return new Response(
        JSON.stringify({ approved: true, reason: "AI moderation unavailable", confidence: 0.5 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    // Parse response based on your AI service's format
    const moderationResult = {
      approved: aiResponse.is_safe,
      reason: aiResponse.reason,
      confidence: aiResponse.confidence
    };
    */

    // For now, default to auto-approval
    const moderationResult = {
      approved: true,
      reason: "AI service configured but not yet implemented",
      confidence: 0.8
    };

    // Log the moderation result if we have a gallery post ID
    if (galleryPostId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from("image_moderation_logs").insert({
        gallery_post_id: galleryPostId,
        image_url: imageUrl,
        moderation_result: moderationResult,
        is_approved: moderationResult.approved,
        rejection_reason: moderationResult.approved ? null : moderationResult.reason,
      });

      // Update the gallery post approval status
      await supabase
        .from("pet_gallery")
        .update({ is_approved: moderationResult.approved })
        .eq("id", galleryPostId);
    }

    return new Response(JSON.stringify(moderationResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Moderation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, approved: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
