/*
  === ENABLE REALTIME FOR MESSAGING ===
  
  Run this script in the Supabase SQL Editor to enable real-time 
  notifications for Support Tickets and Live Chat.
*/

-- 1. Enable Realtime for Messaging Tables
-- Using DO blocks to handle "already member" errors gracefully
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Ensure RLS is enabled and REPLICA IDENTITY is FULL
-- Full replica identity is often needed for real-time to deliver the full payload
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets REPLICA IDENTITY FULL;

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages REPLICA IDENTITY FULL;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- 2.5 Ensure Admins can see ALL tickets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all support tickets'
    ) THEN
        CREATE POLICY "Admins can view all support tickets" ON support_tickets
        FOR SELECT TO authenticated
        USING (
            EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- 3. Add RLS Policies for Ticket Messages (if they don't exist)
-- Allow users to see messages for their own tickets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own ticket messages'
    ) THEN
        CREATE POLICY "Users can view own ticket messages" ON ticket_messages
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM support_tickets 
                WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Allow users to send messages to their own tickets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own ticket messages'
    ) THEN
        CREATE POLICY "Users can insert own ticket messages" ON ticket_messages
        FOR INSERT TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM support_tickets 
                WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Allow Admins to see all ticket messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all ticket messages'
    ) THEN
        CREATE POLICY "Admins can view all ticket messages" ON ticket_messages
        FOR SELECT TO authenticated
        USING (
            EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- Allow Admins to send ticket messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert ticket messages'
    ) THEN
        CREATE POLICY "Admins can insert ticket messages" ON ticket_messages
        FOR INSERT TO authenticated
        WITH CHECK (
            EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;
