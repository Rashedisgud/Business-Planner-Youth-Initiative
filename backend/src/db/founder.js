import { supabase } from './supabaseClient.js';

const TABLE = 'founder';
const ROW_ID = 1;

const EMPTY_FOUNDER = { id: ROW_ID, name: '', bio: '', photo_url: null, updated_at: null };

/**
 * The founder row is created by the schema, but a fresh or partially migrated
 * database won't have it yet. Returning a blank profile keeps the home page
 * rendering instead of failing the whole request over an empty section.
 */
export async function getFounder() {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', ROW_ID).maybeSingle();
  if (error) throw error;
  return data ?? EMPTY_FOUNDER;
}

/** Creates the row if it isn't there yet, so first-time editing works. */
export async function updateFounderInfo(patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, ...patch, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ?? { ...EMPTY_FOUNDER, ...patch };
}
