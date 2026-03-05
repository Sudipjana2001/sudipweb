import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import PaytmChecksum from "npm:paytmchecksum@1.5.0";

const PAYTM_MID = Deno.env.get("PAYTM_MID");
const PAYTM_MERCHANT_KEY = Deno.env.get("PAYTM_MERCHANT_KEY");
const PAYTM_WEBSITE = Deno.env.get("PAYTM_WEBSITE") || "DEFAULT";
const PAYTM_ENV = Deno.env.get("PAYTM_ENV") || "staging";
const PAYTM_CALLBACK_URL = Deno.env.get("PAYTM_CALLBACK_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTransactionRequest {
  amount: number;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId?: string;
}

const getHost = () =>
  PAYTM_ENV.toLowerCase() === "production" ? "https://securegw.paytm.in" : "https://securegw-stage.paytm.in";

const buildOrderId = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PB${Date.now()}${random}`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!PAYTM_MID || !PAYTM_MERCHANT_KEY) {
      return new Response(
        JSON.stringify({
          error: "Paytm not configured. Add PAYTM_MID and PAYTM_MERCHANT_KEY to Supabase secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      amount,
      customerId,
      customerEmail,
      customerPhone,
      orderId: providedOrderId,
    }: CreateTransactionRequest = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const host = getHost();
    const orderId = providedOrderId || buildOrderId();
    const callbackUrl =
      PAYTM_CALLBACK_URL || `${host}/theia/paytmCallback?ORDER_ID=${orderId}`;

    const body = {
      requestType: "Payment",
      mid: PAYTM_MID,
      websiteName: PAYTM_WEBSITE,
      orderId,
      callbackUrl,
      txnAmount: {
        value: amount.toFixed(2),
        currency: "INR",
      },
      userInfo: {
        custId: customerId || `cust_${Date.now()}`,
        ...(customerEmail ? { email: customerEmail } : {}),
        ...(customerPhone ? { mobile: customerPhone } : {}),
      },
    };

    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(body), PAYTM_MERCHANT_KEY);

    const paytmResponse = await fetch(
      `${host}/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          head: { signature: checksum },
        }),
      }
    );

    const result = await paytmResponse.json();
    const status = result?.body?.resultInfo?.resultStatus;

    if (!paytmResponse.ok || status !== "S") {
      console.error("Paytm initiate transaction error:", result);
      throw new Error(result?.body?.resultInfo?.resultMsg || "Failed to initiate Paytm transaction");
    }

    const txnToken = result?.body?.txnToken;
    if (!txnToken) {
      throw new Error("Paytm txn token missing in response");
    }

    return new Response(
      JSON.stringify({
        mid: PAYTM_MID,
        orderId,
        txnToken,
        amount: amount.toFixed(2),
        isStaging: PAYTM_ENV.toLowerCase() !== "production",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating Paytm transaction:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
