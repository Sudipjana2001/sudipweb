import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MERCHANT_ID = Deno.env.get("PHONEPE_MERCHANT_ID") || "PGTESTPAYUAT86"
const SALT_KEY = Deno.env.get("PHONEPE_SALT_KEY") || "96434309-7796-489d-8924-ab56988a6076"
const SALT_INDEX = Deno.env.get("PHONEPE_SALT_INDEX") || "1"
const PHONEPE_HOST = Deno.env.get("PHONEPE_HOST") || "https://api-preprod.phonepe.com/apis/pg-sandbox"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const { merchantTransactionId } = await req.json()

        if (!merchantTransactionId) {
            return new Response(JSON.stringify({ error: "merchantTransactionId is required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }

        // Checksum: SHA256("/pg/v1/status/{merchantId}/{merchantTransactionId}" + SALT_KEY) + "###" + SALT_INDEX
        const apiPath = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`
        const dataToHash = apiPath + SALT_KEY
        const encoder = new TextEncoder()
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(dataToHash))
        const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")

        const xVerify = `${hashHex}###${SALT_INDEX}`

        const response = await fetch(`${PHONEPE_HOST}${apiPath}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
                "X-MERCHANT-ID": MERCHANT_ID,
                accept: "application/json",
            },
        })

        const result = await response.json()
        console.log("PhonePe Verify Response:", result)

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: `PhonePe verification failed: ${result.code} - ${result.message}`,
                    phonepeResponse: result,
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                status: result.data?.state,
                transactionId: result.data?.transactionId,
                merchantTransactionId: result.data?.merchantTransactionId,
                amount: result.data?.amount,
                paymentMode: result.data?.paymentInstrument?.type,
                responseCode: result.data?.responseCode,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error("Edge function error:", error)
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error", details: error.toString() }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        )
    }
})
