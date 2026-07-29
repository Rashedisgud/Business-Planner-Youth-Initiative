import { supabase } from './supabaseClient.js';

const TABLE = 'founder';
const ROW_ID = 1;

export async function getFounder() {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', ROW_ID).single();
  if (error) throw error;
  return data;
}

export async function updateFounderInfo(patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
    .select()
    .single();
  if (error) throw error;
  return data;
}
