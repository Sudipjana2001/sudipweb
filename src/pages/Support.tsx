import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportTickets, useTicketMessages, useAddTicketMessage } from "@/hooks/useSupportTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-muted" },
};

export default function Support() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: tickets = [], isLoading } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

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
          <h1 className="font-display text-4xl font-medium">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">View and manage your support requests</p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-display text-2xl">No support tickets</h2>
            <p className="text-muted-foreground">
              Need help? Use the chat button in the bottom right corner.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ticket List */}
            <div className="lg:col-span-1 space-y-2">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                
                return (
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
                      <p className="font-medium line-clamp-1">{ticket.subject}</p>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <TicketDetail ticketId={selectedTicket} />
              ) : (
                <div className="rounded-lg border border-border bg-card p-12 text-center h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select a ticket to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function TicketDetail({ ticketId }: { ticketId: string }) {
  const { data: messages = [] } = useTicketMessages(ticketId);
  const addMessage = useAddTicketMessage();
  const [newMessage, setNewMessage] = useState("");

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await addMessage.mutateAsync({ ticketId, message: newMessage });
    setNewMessage("");
  };

  return (
    <div className="rounded-lg border border-border bg-card h-[500px] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_staff ? "justify-start" : "justify-end"}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.is_staff 
                ? "bg-muted" 
                : "bg-primary text-primary-foreground"
            }`}>
              <p className="text-sm">{msg.message}</p>
              <p className={`text-xs mt-1 ${
                msg.is_staff ? "text-muted-foreground" : "text-primary-foreground/70"
              }`}>
                {format(new Date(msg.created_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
          />
          <Button onClick={handleSend} disabled={addMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
