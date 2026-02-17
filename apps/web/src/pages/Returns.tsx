import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReturns } from "@/hooks/useReturns";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending Review", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700" },
  processing: { label: "Processing", icon: AlertCircle, color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-700" },
};

const reasonLabels: Record<string, string> = {
  wrong_size: "Wrong Size",
  defective: "Defective/Damaged",
  not_as_described: "Not as Described",
  changed_mind: "Changed My Mind",
  quality_issue: "Quality Issue",
  other: "Other",
};

export default function Returns() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: returns = [], isLoading } = useReturns();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <PageLayout showNewsletter={false}>
        <div className="container mx-auto px-6 py-16">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNewsletter={false}>
      <div className="container mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-medium">My Returns</h1>
          <p className="text-muted-foreground mt-1">Track your return requests</p>
        </div>

        {returns.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <RotateCcw className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-display text-2xl">No return requests</h2>
            <p className="text-muted-foreground">
              You haven't requested any returns yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((returnReq) => {
              const status = statusConfig[returnReq.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <div key={returnReq.id} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Return ID: {returnReq.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {format(new Date(returnReq.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Reason:</span>
                      <span className="text-sm">{reasonLabels[returnReq.reason] || returnReq.reason}</span>
                    </div>
                    
                    {returnReq.description && (
                      <div>
                        <span className="text-sm font-medium">Details:</span>
                        <p className="text-sm text-muted-foreground mt-1">{returnReq.description}</p>
                      </div>
                    )}

                    {returnReq.refund_amount && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-sm font-medium">Refund Amount:</span>
                        <span className="text-sm text-green-600 font-medium">
                          ₹{returnReq.refund_amount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {returnReq.admin_notes && (
                      <div className="bg-muted/50 p-3 rounded-lg mt-3">
                        <span className="text-sm font-medium">Note from support:</span>
                        <p className="text-sm text-muted-foreground mt-1">{returnReq.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
