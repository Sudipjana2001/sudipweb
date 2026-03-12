import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "@/hooks/useOrders";

interface InvoiceDownloadProps {
  order: Order;
}

export function InvoiceDownload({ order }: InvoiceDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const orderMethod = (order.payment_method || "cod").toLowerCase();
  const paymentMethodsFromPayments = (order.payments || [])
    .map((p) => (p.payment_method || "").toLowerCase())
    .filter(Boolean);

  const inferredMethod =
    orderMethod !== "cod"
      ? orderMethod
      : paymentMethodsFromPayments.find((m) => m !== "cod") || "cod";

  const isCod = inferredMethod === "cod";
  const isEligible = isCod
    ? order.status === "delivered"
    : order.status === "shipped" || order.status === "delivered";

  const disabledLabel = isCod ? "Available after delivery" : "Available after shipped";

  const generateInvoice = async () => {
    if (!isEligible) return;
    setIsGenerating(true);
    try {
      const [{ pdf }, { InvoicePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/invoice/InvoicePdf"),
      ]);

      const blob = await pdf(<InvoicePdf order={order} />).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Invoice downloaded");
    } catch (error) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateInvoice}
      disabled={!isEligible || isGenerating}
      title={!isEligible ? disabledLabel : undefined}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {isEligible ? "Download Invoice" : disabledLabel}
    </Button>
  );
}
