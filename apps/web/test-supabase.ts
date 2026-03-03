import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: coll } = await supabase.from('collections').select('*');
    console.log("Collections:", coll);

    const { data: prods } = await supabase.from('products').select('id, name, collection_id, collections(*)').limit(5);
    console.log("Products:", JSON.stringify(prods, null, 2));

    const { data: summerProds } = await supabase.from('products').select('*').eq('collection_id', coll.find(c => c.slug === 'summer')?.id);
    console.log("Summer prods count:", summerProds?.length);
    console.log("collections(id):", coll.find(c => c.slug === 'summer')?.id);
}

check().catch(console.error);
