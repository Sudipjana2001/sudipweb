
import { createClient } from "@supabase/supabase-js";

// Credentials from .env (The one we think has tables)
const URL_ENV = "https://hpnubjnnzhrivbmayifw.supabase.co";
const KEY_ENV = "sb_publishable_RBBddBOIEDEWCdrKxxtO8g_KgEiu8J7";

console.log("Checking Project: ", URL_ENV);

const supabase = createClient(URL_ENV, KEY_ENV);

async function check() {
  // Check profiles table
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log("❌ Error accessing profiles:", error.message);
    if (error.message.includes("does not exist")) {
      console.log("   -> CONFIRMED: Table 'profiles' IS MISSING in this project.");
    }
  } else {
    console.log(`✅ Table 'profiles' EXISTS! (Count: ${count})`);
  }

  // Check auth users (requires service key usually, but let's see if we can sign in or just check public config)
  console.log("\n--- Checking Project ID Hint ---");
  // We can't easily get Project ID from client, but the URL confirms it.
  
  console.log("\nRECOMMENDATION:");
  if (error) {
    console.log("This project (hpnubjnnzhrivbmayifw) is EMPTY. You need to run migrations.");
  } else {
    console.log("This project (hpnubjnnzhrivbmayifw) is POPULATED.");
    console.log("If you are seeing 'relation does not exist' in your browser,");
    console.log("YOU ARE LIKELY LOOKING AT A DIFFERENT PROJECT IN THE DASHBOARD.");
  }
}

check();
