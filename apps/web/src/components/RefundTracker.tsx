import { useUserPayments } from "@/hooks/usePayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

export function RefundTracker() {
  const { data: payments, isLoading } = useUserPayments();

  const refundPayments = payments?.filter(
    (p) => p.refund_status || p.refund_amount > 0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!refundPayments?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCcw className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-lg font-medium">No Refunds</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any refund requests yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5" />
          Refund Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {refundPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(payment.refund_status)}
                <div>
                  <p className="font-medium">
                    Refund of ${payment.refund_amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Original payment: ${payment.amount.toFixed(2)} via{" "}
                    {payment.payment_method.toUpperCase()}
                  </p>
                  {payment.refund_processed_at && (
                    <p className="text-xs text-muted-foreground">
                      Processed on{" "}
                      {format(
                        new Date(payment.refund_processed_at),
                        "MMM d, yyyy"
                      )}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(payment.refund_status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
