import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner"; // Added toast for better error visibility

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  status: "active" | "closed";
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
  user_name?: string;
  user_email?: string;
}

/**
 * Hook to get or create an active chat session for the current user
 */
export function useChatSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["chat-session", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check for existing active session
      const { data: existing, error: fetchError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching session:", fetchError);
        throw fetchError;
      }

      if (existing) return existing as ChatSession;

      // Create new session
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating session:", error);
        throw error;
      }
      return newSession as ChatSession;
    },
    enabled: !!user,
  });

  return sessionQuery;
}

/**
 * Hook to get messages for a chat session with real-time updates
 */
export function useChatMessages(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      return data as ChatMessage[];
    },
    enabled: !!sessionId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat-realtime-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "chat_messages",
          filter: `chat_session_id=eq.${sessionId}`,
        },
        () => {
          // Invalidate and re-fetch - more reliable than manual cache update
          queryClient.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return messagesQuery;
}

/**
 * Hook to send a chat message
 */
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: string;
      message: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          chat_session_id: sessionId,
          sender_id: user.id,
          sender_type: "user",
          message,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session's updated_at
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return data as ChatMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.sessionId] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  });
}

/**
 * Hook for admin to get all active chat sessions
 */
export function useAdminChatSessions() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["admin-chat-sessions"],
    queryFn: async () => {
      // NOTE: We join with profiles. If there is no FK between chat_sessions and profiles, this throws error.
      // We also join with messages to get count/unread.
      
      const { data, error } = await supabase
        .from("chat_sessions")
        .select(`
          *,
          messages:chat_messages(count),
          profile:profiles(full_name, email)
        `)
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching admin session list:", error);
        // Fallback: This commonly fails if 'profiles' relationship is missing.
        // If it fails, try fetching without the profile join to at least show the sessions.
        if (error.message.includes("relationship")) {
           const { data: fallbackData, error: fallbackError } = await supabase
            .from("chat_sessions")
            .select(`
              *,
              messages:chat_messages(count)
            `)
            .eq("status", "active")
            .order("updated_at", { ascending: false });
            
            if (fallbackError) throw fallbackError;
            
            return fallbackData?.map((session: any) => ({
              ...session,
              user_name: "Customer (No Profile)",
              user_email: "Sync Error",
            })) as ChatSession[];
        }
        throw error;
      }
      
      return data?.map((session: any) => ({
        ...session,
        user_name: session.profile?.full_name || "Anonymous",
        user_email: session.profile?.email || "",
      })) as ChatSession[];
    },
    enabled: isAdmin,
    refetchInterval: 5000, 
  });
}

/**
 * Hook for admin to send a message
 */
export function useAdminSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      message,
    }: {
      sessionId: string;
      message: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          chat_session_id: sessionId,
          sender_id: user.id,
          sender_type: "admin",
          message,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session's updated_at
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      return data as ChatMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ["admin-chat-sessions"] });
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesRead() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      senderType,
    }: {
      sessionId: string;
      senderType: "user" | "admin";
    }) => {
      const otherType = senderType === "user" ? "admin" : "user";
      
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("chat_session_id", sessionId)
        .eq("sender_type", otherType)
        .eq("is_read", false);
    },
  });
}

/**
 * Hook to close a chat session
 */
export function useCloseChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ status: "closed" })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-session"] });
      queryClient.invalidateQueries({ queryKey: ["admin-chat-sessions"] });
    },
  });
}
