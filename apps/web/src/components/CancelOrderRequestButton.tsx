import { useState } from "react";
import { toast } from "sonner";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCreateTicket } from "@/hooks/useSupportTickets";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/client";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface CancelOrderRequestButtonProps {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
}

export function CancelOrderRequestButton({ orderId, orderNumber, status }: CancelOrderRequestButtonProps) {
  const { user } = useAuth();
  const createTicket = useCreateTicket();
  const [requested, setRequested] = useState(false);

  const canRequest = status === "pending" || status === "confirmed" || status === "processing";

  const requestCancel = async () => {
    if (!user) {
      toast.error("Please sign in to request cancellation");
      return;
    }

    if (!canRequest) {
      toast.error("Cancellation unavailable", { description: "This order can no longer be cancelled." });
      return;
    }

    try {
      const subject = `Cancellation request: ${orderNumber}`;

      const { data: existing, error: existingError } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("user_id", user.id)
        .eq("order_id", orderId)
        .eq("subject", subject)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        toast.info("Cancellation already requested", { description: "Our team will review it shortly." });
        setRequested(true);
        return;
      }

      await createTicket.mutateAsync({
        subject,
        message: `Please cancel my order ${orderNumber}. Current status: ${status}.`,
        orderId,
        priority: "high",
      });

      setRequested(true);
    } catch (e) {
      toast.error("Failed to request cancellation");
    }
  };

  const disabled = !canRequest || requested || createTicket.isPending;
  const label = requested ? "Cancellation Requested" : "Request Cancel";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <XCircle className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request order cancellation?</AlertDialogTitle>
          <AlertDialogDescription>
            We'll send your request to support. If the order is already shipped, cancellation may not be possible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Order</AlertDialogCancel>
          <AlertDialogAction onClick={requestCancel}>Request Cancellation</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

