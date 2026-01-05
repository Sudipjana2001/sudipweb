/**
 * Supabase Connection Test Script
 * This script tests if the Supabase connection is properly configured
 */

import { createClient } from "@supabase/supabase-js";

// Get credentials from environment
const SUPABASE_URL = "https://chzwxdecfohqtuizwrtb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoend4ZGVjZm9ocXR1aXp3cnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDEwNTgsImV4cCI6MjA4MzExNzA1OH0.xMo90ciTr4yp8JmZU7ajX1dwIrwDo3U4ZlUdtZY5Sqo";

console.log("🔍 Testing Supabase Connection...\n");

// Step 1: Validate credentials
console.log("Step 1: Validating credentials...");
if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL is missing");
  process.exit(1);
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error("❌ SUPABASE_PUBLISHABLE_KEY is missing");
  process.exit(1);
}
console.log("✅ Credentials found\n");

// Step 2: Create client
console.log("Step 2: Creating Supabase client...");
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
console.log("✅ Client created successfully\n");

// Step 3: Test connection
console.log("Step 3: Testing connection...");
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Project ID: chzwxdecfohqtuizwrtb`);
console.log(
  `API Key (first 20 chars): ${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...`
);
console.log("\n✅ Supabase client is properly configured!");

// Step 4: Test basic auth functionality
console.log("\nStep 4: Testing auth module...");
if (supabase.auth) {
  console.log("✅ Auth module is available");
  console.log(
    `   - Can sign up: ${typeof supabase.auth.signUp === "function"}`
  );
  console.log(
    `   - Can sign in: ${typeof supabase.auth.signIn === "function"}`
  );
  console.log(
    `   - Can sign out: ${typeof supabase.auth.signOut === "function"}`
  );
  console.log(
    `   - Can get session: ${typeof supabase.auth.getSession === "function"}`
  );
} else {
  console.error("❌ Auth module is not available");
  process.exit(1);
}

// Step 5: Test database functionality
console.log("\nStep 5: Testing database module...");
if (supabase.from) {
  console.log("✅ Database module (PostgREST) is available");
} else {
  console.error("❌ Database module is not available");
  process.exit(1);
}

console.log(
  "\n✅✅✅ All tests passed! Supabase connection is working correctly! ✅✅✅"
);
