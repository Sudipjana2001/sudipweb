// Test Supabase transform URL generation inside the app workspace
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const path = 'products/1769955579574-ovnmuf.png';
const { data: regularData } = supabase.storage.from('product-images').getPublicUrl(path);
const { data: transformData } = supabase.storage.from('product-images').getPublicUrl(path, {
  transform: {
    width: 480,
    height: 600,
    quality: 75,
    resize: 'cover'
  }
});

console.log("Regular URL:", regularData.publicUrl);
console.log("Transform URL:", transformData.publicUrl);

async function testFetch() {
  console.log("\nFetching Regular Image...");
  const res1 = await fetch(regularData.publicUrl);
  console.log("Status:", res1.status);
  console.log("Content-Type:", res1.headers.get("content-type"));
  console.log("Content-Length (bytes):", res1.headers.get("content-length"));

  console.log("\nFetching Transform Image...");
  const res2 = await fetch(transformData.publicUrl);
  console.log("Status:", res2.status);
  console.log("Content-Type:", res2.headers.get("content-type"));
  console.log("Content-Length (bytes):", res2.headers.get("content-length"));
  if (res2.status !== 200) {
    console.log("Error Body:", await res2.text());
  }
}

testFetch().catch(console.error);
