import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  DollarSign,
} from "lucide-react";
import {
  useAllPayments,
  useUpdatePaymentStatus,
  useProcessRefund,
  usePaymentStats,
} from "@/hooks/usePayments";
import { format } from "date-fns";

export function PaymentReconciliation() {
  const { data: payments, isLoading } = useAllPayments();
  const { data: stats } = usePaymentStats();
  const updateStatus = useUpdatePaymentStatus();
  const processRefund = useProcessRefund();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refundAmount, setRefundAmount] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredPayments =
    statusFilter === "all"
      ? payments
      : payments?.filter((p) => p.payment_status === statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRefund = async (paymentId: string) => {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) return;

    await processRefund.mutateAsync({ paymentId, refundAmount: amount });
    setSelectedPayment(null);
    setRefundAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₹{stats?.totalRefunds?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats?.netRevenue?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.pendingPayments || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      {stats?.methodBreakdown && Object.keys(stats.methodBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.methodBreakdown).map(([method, count]) => (
                <div
                  key={method}
                  className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg"
                >
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">{method}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Transactions
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!filteredPayments?.length ? (
            <p className="text-center text-muted-foreground py-8">
              No payments found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payment.payment_status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ₹{payment.amount.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground capitalize">
                          via {payment.payment_method}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                        {payment.transaction_id && (
                          <> • TXN: {payment.transaction_id}</>
                        )}
                      </p>
                      {payment.refund_amount > 0 && (
                        <p className="text-xs text-destructive">
                          Refunded: ₹{payment.refund_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(payment.payment_status)}
                    <div className="flex gap-2">
                      {payment.payment_status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus.mutate({
                              paymentId: payment.id,
                              status: "completed",
                            })
                          }
                        >
                          Mark Paid
                        </Button>
                      )}
                      {payment.payment_status === "completed" &&
                        !payment.refund_status && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(payment.id);
                                  setRefundAmount(payment.amount.toString());
                                }}
                              >
                                <RefreshCcw className="h-4 w-4 mr-1" />
                                Refund
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Refund</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Original Amount</Label>
                                  <p className="text-lg font-bold">
                                    ₹{payment.amount.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor="refundAmount">
                                    Refund Amount
                                  </Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      id="refundAmount"
                                      type="number"
                                      value={refundAmount}
                                      onChange={(e) =>
                                        setRefundAmount(e.target.value)
                                      }
                                      className="pl-9"
                                      max={payment.amount}
                                    />
                                  </div>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => handleRefund(payment.id)}
                                  disabled={processRefund.isPending}
                                >
                                  {processRefund.isPending
                                    ? "Processing..."
                                    : "Process Refund"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
