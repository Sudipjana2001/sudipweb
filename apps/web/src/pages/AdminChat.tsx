import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminChatSessions,
  useChatMessages,
  useAdminSendMessage,
  useMarkMessagesRead,
  useCloseChatSession,
  ChatSession,
} from "@/hooks/useLiveChat";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { MessageCircle, Send, X, User, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";

function ChatSessionItem({
  session,
  isActive,
  onClick,
}: {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-border transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-muted"
      } ${!isActive && session.unread_count ? "bg-primary/5" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p
              className={`font-medium ${session.unread_count ? "text-foreground" : ""}`}
            >
              {session.user_name || "Customer"}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.user_email}
            </p>
            {session.last_message && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {session.last_message}
              </p>
            )}
          </div>
        </div>
        {session.unread_count && session.unread_count > 0 && (
          <Badge variant="destructive" className="text-xs">
            {session.unread_count}
          </Badge>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {new Date(session.updated_at).toLocaleString()}
      </div>
    </button>
  );
}

function ChatWindow({
  session,
  onClose,
}: {
  session: ChatSession;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useChatMessages(session.id);
  const sendMessage = useAdminSendMessage();
  const { mutate: markMessagesRead } = useMarkMessagesRead();
  const closeSession = useCloseChatSession();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (session.id) {
      markMessagesRead({ sessionId: session.id, senderType: "admin" });
    }
  }, [markMessagesRead, messages.length, session.id]);

  const handleSend = async () => {
    if (!message.trim()) return;

    await sendMessage.mutateAsync({
      sessionId: session.id,
      message: message.trim(),
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = async () => {
    await closeSession.mutateAsync(session.id);
    setIsCloseDialogOpen(false);
    onClose();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-border p-4 bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{session.user_name || "Customer"}</p>
            <p className="text-sm text-muted-foreground">
              {session.user_email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCloseDialogOpen(true)}
        >
          <X className="h-4 w-4 mr-1" />
          Close Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_type === "admin" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender_type === "admin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                } break-words`}
              >
                <p>{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender_type === "admin"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your reply..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>

      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this chat session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from the active chat list. You
              can still keep the message history in the database for records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeSession.isPending}>
              Keep Chat Open
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              disabled={closeSession.isPending}
            >
              {closeSession.isPending ? "Closing..." : "Close Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminChat() {
  const { isAdmin, isLoading } = useAuth();
  const { data: sessions = [], isLoading: isSessionsLoading } =
    useAdminChatSessions();
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  useEffect(() => {
    if (!activeSession) return;

    const updatedActiveSession = sessions.find(
      (session) => session.id === activeSession.id,
    );

    setActiveSession(updatedActiveSession || null);
  }, [activeSession, sessions]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Helmet>
        <title>Live Chat Support | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Top Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <h1 className="flex items-center gap-3 text-lg font-semibold">
          <MessageCircle className="h-5 w-5" />
          Live Chat Support
        </h1>
        <a
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sessions List — hidden on mobile when a chat is active */}
        <div
          className={`w-full border-r border-border overflow-y-auto bg-card md:w-[320px] lg:w-[350px] ${
            activeSession ? "hidden md:block" : "block"
          }`}
        >
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <h2 className="text-sm font-semibold">
              Active Chats ({sessions.length})
            </h2>
          </div>
          {isSessionsLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No active chats</p>
              <p className="mt-1 text-sm">
                Chats will appear here when customers message you
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isActive={activeSession?.id === session.id}
                onClick={() => setActiveSession(session)}
              />
            ))
          )}
        </div>

        {/* Chat Window */}
        {activeSession ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Mobile back button */}
            <button
              onClick={() => setActiveSession(null)}
              className="border-b border-border px-4 py-2 text-left text-sm text-muted-foreground hover:text-foreground md:hidden"
            >
              ← Back to chats
            </button>
            <ChatWindow
              session={activeSession}
              onClose={() => setActiveSession(null)}
            />
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center text-muted-foreground md:flex">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg">Select a chat to start responding</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
