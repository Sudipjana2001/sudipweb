import { useState, useCallback } from "react";
import { supabase } from "@/integrations/client";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  config?: {
    display?: {
      blocks?: Record<string, unknown>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = useCallback(async (amount: number): Promise<CreateOrderResult> => {
    const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
      body: { amount, currency: "INR" },
    });

    if (error) throw new Error(error.message || "Failed to create payment order");
    if (data.error) throw new Error(data.error);

    return data as CreateOrderResult;
  }, []);

  const verifyPayment = useCallback(async (response: RazorpayResponse): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", {
      body: {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      },
    });

    if (error) throw new Error(error.message || "Payment verification failed");
    return data?.verified === true;
  }, []);

  const openCheckout = useCallback(
    async ({
      amount,
      customerName,
      customerEmail,
      customerPhone,
      onSuccess,
      onFailure,
    }: {
      amount: number;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      onSuccess: (response: RazorpayResponse) => void;
      onFailure: (error: string) => void;
    }) => {
      setIsLoading(true);

      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load Razorpay. Please check your internet connection.");
        }

        const order = await createOrder(amount);

        const options: RazorpayOptions = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Pebric",
          description: "Order Payment",
          order_id: order.orderId,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: "#1a1a1a",
          },
          handler: (response) => {
            onSuccess(response);
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              onFailure("Payment was cancelled");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payment failed";
        onFailure(message);
      } finally {
        setIsLoading(false);
      }
    },
    [createOrder]
  );

  return { openCheckout, verifyPayment, isLoading };
}
