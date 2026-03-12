import { useAdminTickets, useUpdateTicketStatus, useAddTicketMessage, useTicketMessages } from "@/hooks/useSupportTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/client";
import { toast } from "sonner";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export function SupportManager() {
  const { data: tickets = [], isLoading } = useAdminTickets();
  const updateStatus = useUpdateTicketStatus();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No support tickets</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[350px_1fr]">
      {/* Ticket List */}
      <div className="space-y-2 h-[60vh] min-h-[360px] lg:h-[500px] overflow-y-auto pr-2">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => setSelectedTicket(ticket.id)}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              selectedTicket === ticket.id 
                ? "border-primary bg-primary/5" 
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                <Badge variant="outline">{ticket.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(ticket.created_at), 'MMM d')}
              </span>
            </div>
            <p className="font-medium line-clamp-1">{ticket.subject}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{ticket.email}</p>
          </button>
        ))}
      </div>

      {/* Ticket Detail */}
      {selectedTicket ? (
        <TicketDetail 
          ticketId={selectedTicket} 
          ticket={tickets.find(t => t.id === selectedTicket)!}
          onStatusChange={(status) => updateStatus.mutate({ ticketId: selectedTicket, status })}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 sm:p-12 flex items-center justify-center">
          <p className="text-muted-foreground">Select a ticket</p>
        </div>
      )}
    </div>
  );
}

function TicketDetail({ 
  ticketId, 
  ticket,
  onStatusChange 
}: { 
  ticketId: string; 
  ticket: NonNullable<ReturnType<typeof useAdminTickets>['data']>[0];
  onStatusChange: (status: string) => void;
}) {
  const { data: messages = [] } = useTicketMessages(ticketId);
  const addMessage = useAddTicketMessage();
  const updateTicketStatus = useUpdateTicketStatus();
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    await addMessage.mutateAsync({ ticketId, message: reply, isStaff: true });
    setReply("");
  };

  const isCancelRequest =
    !!ticket.order_id && ticket.subject.toLowerCase().startsWith("cancellation request:");

  const handleCancelOrder = async () => {
    if (!ticket.order_id) return;

    setIsCancellingOrder(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", ticket.order_id)
        .in("status", ["pending", "confirmed", "processing"])
        .select("id,status");

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Order cannot be cancelled", {
          description: "It may have already shipped, delivered, or been cancelled.",
        });
        return;
      }

      await addMessage.mutateAsync({
        ticketId,
        message: `Order cancelled by admin (Order ID: ${ticket.order_id}).`,
        isStaff: true,
      });

      await updateTicketStatus.mutateAsync({ ticketId, status: "resolved" });
      toast.success("Order cancelled");
      onStatusChange("resolved");
    } catch (e: any) {
      toast.error("Failed to cancel order", { description: e?.message || "Please try again." });
    } finally {
      setIsCancellingOrder(false);
    }
  };

  return (
    <div className="rounded-lg border flex flex-col h-[60vh] min-h-[360px] lg:h-[500px]">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="font-medium break-words">{ticket.subject}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {isCancelRequest && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelOrder}
                disabled={isCancellingOrder || updateTicketStatus.isPending}
              >
                {isCancellingOrder ? "Cancelling..." : "Cancel Order"}
              </Button>
            )}
            <Select value={ticket.status} onValueChange={onStatusChange}>
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
        </div>
        <p className="text-sm text-muted-foreground">{ticket.email}</p>
        <p className="text-sm mt-2">{ticket.message}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_staff ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.is_staff 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            }`}>
              <p className="text-sm">{msg.message}</p>
              <p className={`text-xs mt-1 ${
                msg.is_staff ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {format(new Date(msg.created_at), 'h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
            placeholder="Type your reply..."
          />
          <Button onClick={handleReply} disabled={addMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
