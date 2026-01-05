
import { createClient } from "@supabase/supabase-js";

// Uses the credentials from your .env
const URL = "https://hpnubjnnzhrivbmayifw.supabase.co";
const KEY = "sb_publishable_RBBddBOIEDEWCdrKxxtO8g_KgEiu8J7"; 

const supabase = createClient(URL, KEY);

async function testLogin() {
  console.log("Attempting login with: admin@pebric.com");
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@pebric.com",
    password: "AdminPassword123!",
  });

  if (error) {
    console.error("\n❌ LOGIN FAILED:");
    console.error("Error Message:", error.message);
    console.error("Status:", error.status);
    console.error("Name:", error.name);
  } else {
    console.log("\n✅ LOGIN SUCCESSFUL!");
    console.log("User ID:", data.user.id);
    console.log("Session detected.");
  }
}

testLogin();
