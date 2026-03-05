import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import PaytmChecksum from "npm:paytmchecksum@1.5.0";

const PAYTM_MID = Deno.env.get("PAYTM_MID");
const PAYTM_MERCHANT_KEY = Deno.env.get("PAYTM_MERCHANT_KEY");
const PAYTM_ENV = Deno.env.get("PAYTM_ENV") || "staging";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  orderId: string;
}

const getHost = () =>
  PAYTM_ENV.toLowerCase() === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!PAYTM_MID || !PAYTM_MERCHANT_KEY) {
      return new Response(
        JSON.stringify({ error: "Paytm not configured. Add PAYTM_MID and PAYTM_MERCHANT_KEY to Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderId }: VerifyRequest = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = {
      mid: PAYTM_MID,
      orderId,
    };

    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(body), PAYTM_MERCHANT_KEY);
    const host = getHost();

    const paytmResponse = await fetch(`${host}/v3/order/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        head: { signature: checksum },
      }),
    });

    const result = await paytmResponse.json();
    const resultStatus = result?.body?.resultInfo?.resultStatus;
    const verified = resultStatus === "TXN_SUCCESS";

    return new Response(
      JSON.stringify({
        verified,
        orderId: result?.body?.orderId || orderId,
        transactionId: result?.body?.txnId || null,
        paymentMode: result?.body?.paymentMode || null,
        status: resultStatus || "UNKNOWN",
        message: result?.body?.resultInfo?.resultMsg || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error verifying Paytm payment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
