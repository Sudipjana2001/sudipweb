import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// PhonePe configuration (reads from Supabase Secrets first, then falls back to test creds)
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
        const { amount, customerId, customerPhone, customerEmail, redirectUrl } = await req.json()

        if (!amount) {
            return new Response(JSON.stringify({ error: "Amount is required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }

        const merchantTransactionId = `TXN${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`

        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: customerId || "MUID001",
            amount: Math.round(amount * 100), // paise
            redirectUrl: redirectUrl || "http://localhost:8080/checkout",
            redirectMode: "REDIRECT",
            callbackUrl: redirectUrl || "http://localhost:8080/checkout",
            paymentInstrument: {
                type: "PAY_PAGE",
            },
        }

        // Base64 encode the payload
        const base64Payload = btoa(JSON.stringify(payload))

        // Checksum: SHA256(base64Payload + "/pg/v1/pay" + SALT_KEY) + "###" + SALT_INDEX
        const dataToHash = base64Payload + "/pg/v1/pay" + SALT_KEY
        const encoder = new TextEncoder()
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(dataToHash))
        const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")

        const xVerify = `${hashHex}###${SALT_INDEX}`

        console.log("PhonePe Pay Request:", {
            url: `${PHONEPE_HOST}/pg/v1/pay`,
            merchantId: MERCHANT_ID,
            transactionId: merchantTransactionId,
            amount: payload.amount,
            xVerify,
        })

        const response = await fetch(`${PHONEPE_HOST}/pg/v1/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify,
                accept: "application/json",
            },
            body: JSON.stringify({ request: base64Payload }),
        })

        const result = await response.json()
        console.log("PhonePe API Response:", result)

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    error: `PhonePe: ${result.code || response.status} - ${result.message || "Payment initiation failed"}`,
                    phonepeResponse: result,
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            )
        }

        const redirectUrlFromPhonePe = result.data?.instrumentResponse?.redirectInfo?.url
        return new Response(
            JSON.stringify({
                success: true,
                redirectUrl: redirectUrlFromPhonePe,
                merchantTransactionId,
                amount,
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
