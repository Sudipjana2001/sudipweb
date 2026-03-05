import { supabase } from "@/integrations/client";

type AnySupabase = {
  from: (table: string) => any;
};

export function fromTable(table: string) {
  return (supabase as unknown as AnySupabase).from(table);
}

