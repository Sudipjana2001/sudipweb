
import { createClient } from "@supabase/supabase-js";

const URL = "https://hpnubjnnzhrivbmayifw.supabase.co";
const KEY = "sb_publishable_RBBddBOIEDEWCdrKxxtO8g_KgEiu8J7"; 

const supabase = createClient(URL, KEY);

async function testSignup() {
  console.log("Attempting Signup API call...");
  
  const { data, error } = await supabase.auth.signUp({
    email: "admin@pebric.com",
    password: "AdminPassword123!",
    options: {
      data: {
        full_name: "Admin User API Created"
      }
    }
  });

  if (error) {
    console.error("\n❌ SIGNUP FAILED:");
    console.error("Msg:", error.message);
    console.error("Status:", error.status);
  } else {
    console.log("\n✅ SIGNUP SUCCESSFUL!");
    console.log("User ID:", data.user?.id);
    console.log("Check your email? (If confirmation is on)");
    console.log("Session:", !!data.session);
  }
}

testSignup();
