/**
 * Script to verify Supabase database tables exist
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hpnubjnnzhrivbmayifw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_RBBddBOIEDEWCdrKxxtO8g_KgEiu8J7";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const CRITICAL_TABLES = [
  "products",
  "collections",
  "categories",
  "orders",
  "profiles",
  "user_roles",
  "cart_items",
  "pets",
  "pet_gallery",
  "dynamic_pricing_rules",
  "campaigns",
];

console.log("🔍 Verifying Database Tables...\n");

async function verifyTables() {
  const results: Record<string, string> = {};

  for (const tableName of CRITICAL_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        results[tableName] = `❌ ERROR: ${error.message}`;
      } else {
        results[tableName] = `✅ EXISTS (accessible)`;
      }
    } catch (err) {
      results[tableName] = `❌ EXCEPTION: ${err}`;
    }
  }

  console.log("📊 Table Verification Results:\n");
  console.log("═".repeat(60));
  
  Object.entries(results).forEach(([table, status]) => {
    console.log(`${table.padEnd(30)} ${status}`);
  });
  
  console.log("═".repeat(60));

  const successCount = Object.values(results).filter((s) =>
    s.includes("✅")
  ).length;
  const failCount = CRITICAL_TABLES.length - successCount;

  console.log(`\n📈 Summary: ${successCount}/${CRITICAL_TABLES.length} tables accessible`);
  
  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount} tables are not accessible or missing`);
    console.log("\nPossible reasons:");
    console.log("1. Tables haven't been created in Supabase yet");
    console.log("2. RLS policies are blocking access");
    console.log("3. Using wrong Supabase project credentials");
    console.log("\nNext steps:");
    console.log("- Check Supabase Dashboard → Table Editor");
    console.log("- Run migrations if needed");
    console.log("- Verify RLS policies allow anonymous access for reading");
  } else {
    console.log("\n✅ All critical tables are accessible!");
  }
}

verifyTables();
