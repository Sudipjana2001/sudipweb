import { useState } from "react";
import { useCreateReturn } from "@/hooks/useReturns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

interface ReturnRequestFormProps {
  orderId: string;
  orderItemId?: string;
  productName?: string;
}

const returnReasons = [
  { value: "wrong_size", label: "Wrong Size" },
  { value: "defective", label: "Defective/Damaged" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "changed_mind", label: "Changed My Mind" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

export function ReturnRequestForm({ orderId, orderItemId, productName }: ReturnRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const createReturn = useCreateReturn();

  const handleSubmit = async () => {
    if (!reason) return;
    
    await createReturn.mutateAsync({
      orderId,
      orderItemId,
      reason,
      description,
    });
    
    setIsOpen(false);
    setReason("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          Return
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {productName && (
            <p className="text-sm text-muted-foreground">
              Requesting return for: <strong>{productName}</strong>
            </p>
          )}
          
          <div className="space-y-2">
            <Label>Reason for Return *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {returnReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Details</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide more details about your return request..."
              rows={4}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p>📦 Returns are accepted within 14 days of delivery</p>
            <p>💰 Refunds are processed within 5-7 business days</p>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={!reason || createReturn.isPending}
          >
            {createReturn.isPending ? "Submitting..." : "Submit Return Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
