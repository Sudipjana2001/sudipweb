/*
  === URGENT DATABASE FIX FOR LIVE CHAT ===
  
  Run this entire script in the Supabase SQL Editor.
  
  PROBLEM: The "Live Chat" messages are not showing up because 
  the database is missing a link between "Chats" and "User Profiles",
  and the Admin does not have permission to view them.
  
  SOLUTION: This script creates the missing link and grants full viewing permissions to the Admin.
*/

-- 1. Create the link between Chats and Profiles (Ignore error if it already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chat_sessions_to_profiles_fkey'
    ) THEN
        ALTER TABLE chat_sessions
        ADD CONSTRAINT chat_sessions_to_profiles_fkey
        FOREIGN KEY (user_id)
        REFERENCES profiles(id);
    END IF;
END $$;

-- 2. Grant Database Permissions (RLS Policies)

-- Allow Admin to see all Profiles (to see customer names)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow Admin to see all Chat Sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON chat_sessions;
CREATE POLICY "Admins can view all sessions"
ON chat_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow Admin to see all Messages
DROP POLICY IF EXISTS "Admins can view all messages" ON chat_messages;
CREATE POLICY "Admins can view all messages"
ON chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Ensure Admin Role checks work
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
CREATE POLICY "Users can read own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
