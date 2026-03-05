import { useCallback, useState } from "react";
import { supabase } from "@/integrations/client";

declare global {
  interface Window {
    Paytm?: {
      CheckoutJS: {
        init: (config: PaytmCheckoutConfig) => Promise<void>;
        invoke: () => void;
        close: () => void;
      };
    };
  }
}

interface CreateTransactionResult {
  mid: string;
  orderId: string;
  txnToken: string;
  amount: string;
  isStaging: boolean;
}

interface PaytmCheckoutConfig {
  root: string;
  flow: "DEFAULT";
  data: {
    orderId: string;
    token: string;
    tokenType: "TXN_TOKEN";
    amount: string;
  };
  merchant: {
    mid: string;
    redirect: boolean;
  };
  handler: {
    transactionStatus: (data: PaytmPaymentResponse) => void;
    notifyMerchant: (eventName: string) => void;
  };
}

export interface PaytmPaymentResponse {
  ORDERID?: string;
  TXNID?: string;
  STATUS?: string;
  RESPCODE?: string;
  RESPMSG?: string;
  TXNAMOUNT?: string;
  PAYMENTMODE?: string;
}

function getCheckoutHost(isStaging: boolean): string {
  return isStaging ? "https://securegw-stage.paytm.in" : "https://securegw.paytm.in";
}

function loadPaytmScript(mid: string, isStaging: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Paytm?.CheckoutJS) {
      resolve(true);
      return;
    }

    const host = getCheckoutHost(isStaging);
    const script = document.createElement("script");
    script.src = `${host}/merchantpgpui/checkoutjs/merchants/${mid}.js`;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function usePaytm() {
  const [isLoading, setIsLoading] = useState(false);

  const createTransaction = useCallback(
    async ({
      amount,
      customerEmail,
      customerPhone,
      customerId,
    }: {
      amount: number;
      customerEmail?: string;
      customerPhone?: string;
      customerId?: string;
    }): Promise<CreateTransactionResult> => {
      const { data, error } = await supabase.functions.invoke("create-paytm-transaction", {
        body: {
          amount,
          customerId,
          customerEmail,
          customerPhone,
        },
      });

      if (error) throw new Error(error.message || "Failed to create Paytm transaction");
      if (data?.error) throw new Error(data.error);

      return data as CreateTransactionResult;
    },
    []
  );

  const verifyPayment = useCallback(async (orderId: string): Promise<{
    verified: boolean;
    transactionId?: string | null;
    paymentMode?: string | null;
  }> => {
    const { data, error } = await supabase.functions.invoke("verify-paytm-payment", {
      body: { orderId },
    });

    if (error) throw new Error(error.message || "Failed to verify Paytm payment");
    if (data?.error) throw new Error(data.error);

    return {
      verified: data?.verified === true,
      transactionId: data?.transactionId ?? null,
      paymentMode: data?.paymentMode ?? null,
    };
  }, []);

  const openCheckout = useCallback(
    async ({
      amount,
      customerEmail,
      customerPhone,
      customerId,
      onSuccess,
      onFailure,
    }: {
      amount: number;
      customerEmail?: string;
      customerPhone?: string;
      customerId?: string;
      onSuccess: (response: PaytmPaymentResponse) => void;
      onFailure: (error: string) => void;
    }) => {
      setIsLoading(true);

      try {
        const transaction = await createTransaction({
          amount,
          customerEmail,
          customerPhone,
          customerId,
        });

        const scriptLoaded = await loadPaytmScript(transaction.mid, transaction.isStaging);
        if (!scriptLoaded || !window.Paytm?.CheckoutJS) {
          throw new Error("Failed to load Paytm Checkout.");
        }

        const config: PaytmCheckoutConfig = {
          root: "",
          flow: "DEFAULT",
          data: {
            orderId: transaction.orderId,
            token: transaction.txnToken,
            tokenType: "TXN_TOKEN",
            amount: transaction.amount,
          },
          merchant: {
            mid: transaction.mid,
            redirect: false,
          },
          handler: {
            transactionStatus: (data) => {
              onSuccess({ ...data, ORDERID: data.ORDERID || transaction.orderId });
            },
            notifyMerchant: (eventName: string) => {
              if (eventName === "APP_CLOSED") {
                onFailure("Payment window was closed.");
              }
            },
          },
        };

        await window.Paytm.CheckoutJS.init(config);
        window.Paytm.CheckoutJS.invoke();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Paytm checkout failed";
        onFailure(message);
      } finally {
        setIsLoading(false);
      }
    },
    [createTransaction]
  );

  return { openCheckout, verifyPayment, isLoading };
}
