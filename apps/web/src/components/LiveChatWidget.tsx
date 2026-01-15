import { useState } from "react";
import { useCreateTicket } from "@/hooks/useSupportTickets";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MessageCircle, Send } from "lucide-react";

interface LiveChatWidgetProps {
  orderId?: string;
}

export function LiveChatWidget({ orderId }: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [priority, setPriority] = useState("medium");
  const { user } = useAuth();
  const createTicket = useCreateTicket();

  const handleSubmit = async () => {
    if (!subject || !message || (!user && !email)) return;
    
    await createTicket.mutateAsync({
      subject,
      message,
      email: user?.email || email,
      orderId,
      priority,
    });
    
    setIsOpen(false);
    setSubject("");
    setMessage("");
    setEmail("");
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
            <MessageCircle className="h-6 w-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contact Support
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              We typically respond within 24 hours. For urgent issues, please call us.
            </p>

            {!user && (
              <div className="space-y-2">
                <Label>Your Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General inquiry</SelectItem>
                  <SelectItem value="medium">Medium - Need help soon</SelectItem>
                  <SelectItem value="high">High - Urgent issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                rows={4}
              />
            </div>

            {orderId && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                📦 This ticket will be linked to your order
              </p>
            )}

            <Button 
              onClick={handleSubmit} 
              className="w-full gap-2" 
              disabled={!subject || !message || (!user && !email) || createTicket.isPending}
            >
              <Send className="h-4 w-4" />
              {createTicket.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
