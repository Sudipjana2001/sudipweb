import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportTickets, useTicketMessages, useAddTicketMessage, useCreateTicket } from "@/hooks/useSupportTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Send, 
  HelpCircle, 
  Package, 
  Truck, 
  RotateCcw, 
  Mail, 
  Phone,
  Plus,
  FileQuestion,
  Headphones
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-muted" },
};

const quickLinks = [
  { icon: FileQuestion, title: "FAQs", description: "Find quick answers", href: "/faq" },
  { icon: Truck, title: "Track Order", description: "Check order status", href: "/tracking" },
  { icon: RotateCcw, title: "Returns", description: "Start a return", href: "/returns" },
  { icon: Package, title: "Orders", description: "View past orders", href: "/orders" },
];

export default function Support() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: tickets = [], isLoading } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  return (
    <PageLayout showNewsletter={false}>
      {/* Hero Section */}
      <section className="bg-muted py-16 md:py-20">
        <div className="container mx-auto px-6 text-center">
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Help Center
          </p>
          <h1 className="mb-4 font-display text-5xl font-medium tracking-tight md:text-6xl">
            How can we help?
          </h1>
          <p className="mx-auto max-w-xl font-body text-lg text-muted-foreground">
            Get answers to your questions, track orders, or reach out to our support team.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                to={link.href}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
                  <link.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-medium">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-6">
          <h2 className="mb-8 text-center font-display text-2xl font-medium">Get in Touch</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <a href="mailto:support@twinning.com" className="text-sm text-muted-foreground hover:text-foreground">
                  support@twinning.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Phone className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <a href="tel:+1234567890" className="text-sm text-muted-foreground hover:text-foreground">
                  +1 (234) 567-890
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Headphones className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Live Chat</p>
                <p className="text-sm text-muted-foreground">Available 9am - 6pm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Tickets Section */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-medium">Your Support Tickets</h2>
              <p className="text-muted-foreground text-sm mt-1">Manage your support requests</p>
            </div>
            {user && (
              <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                  </DialogHeader>
                  <NewTicketForm onSuccess={() => setIsNewTicketOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!user ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 font-display text-2xl">Sign in to view tickets</h3>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to submit and track your support requests.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => navigate("/login")}>Sign In</Button>
                <Button variant="outline" onClick={() => navigate("/signup")}>Create Account</Button>
              </div>
            </div>
          ) : authLoading || isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-display text-xl">No tickets yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't created any support tickets. Need help with something?
              </p>
              <Button onClick={() => setIsNewTicketOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Ticket
              </Button>
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
      </section>
    </PageLayout>
  );
}

function NewTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const createTicket = useCreateTicket();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createTicket.mutateAsync({ 
        subject: `[${category.toUpperCase()}] ${subject}`, 
        message 
      });
      toast.success("Ticket created successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to create ticket");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="general">General Inquiry</option>
          <option value="order">Order Issue</option>
          <option value="shipping">Shipping Question</option>
          <option value="return">Return / Exchange</option>
          <option value="product">Product Question</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue in detail..."
          rows={5}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={createTicket.isPending}>
        {createTicket.isPending ? "Creating..." : "Submit Ticket"}
      </Button>
    </form>
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
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
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
          ))
        )}
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
