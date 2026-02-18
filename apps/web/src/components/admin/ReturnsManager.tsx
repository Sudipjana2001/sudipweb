import { useAdminReturns, useUpdateReturnStatus } from "@/hooks/useReturns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { format } from "date-fns";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
];

const reasonLabels: Record<string, string> = {
  wrong_size: "Wrong Size",
  defective: "Defective/Damaged",
  not_as_described: "Not as Described",
  changed_mind: "Changed Mind",
  quality_issue: "Quality Issue",
  other: "Other",
};

export function ReturnsManager() {
  const { data: returns = [], isLoading } = useAdminReturns();
  const updateStatus = useUpdateReturnStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <RotateCcw className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No return requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {returns.map((returnReq) => (
        <div key={returnReq.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium">Return #{returnReq.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(returnReq.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <Select
              value={returnReq.status}
              onValueChange={(status) => updateStatus.mutate({ returnId: returnReq.id, status })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reason:</span>
              <p className="font-medium">{reasonLabels[returnReq.reason] || returnReq.reason}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Order ID:</span>
              <p className="font-medium">{returnReq.order_id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {returnReq.description && (
            <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
              <span className="text-muted-foreground">Customer notes:</span>
              <p>{returnReq.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
