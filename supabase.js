import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function savePrediction({ nickname, order, champion, relegated }) {
  if (!supabase) throw new Error("Supabase is not configured — check your .env.local");
  const { error } = await supabase.from("predictions").upsert(
    {
      nickname,
      order_ids: order,
      champion,
      relegated,
      saved_at: new Date().toISOString(),
    },
    { onConflict: "nickname" }
  );
  if (error) throw error;
}

export async function loadPredictions() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("predictions").select("*");
  if (error) throw error;
  return (data || []).map((row) => ({
    nickname: row.nickname,
    order: row.order_ids,
    champion: row.champion,
    relegated: row.relegated,
    savedAt: row.saved_at,
  }));
}
