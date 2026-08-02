import { supabase } from './supabaseClient.js';

const TABLE = 'contact';
const ROW_ID = 1;

const EMPTY = { id: ROW_ID, email: '', phone: '', instagram: '', updated_at: null };

/**
 * Blank rather than an error when the row isn't there, so a database that
 * predates this table leaves the footer without contact details instead of
 * failing the page.
 */
export async function getContact() {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', ROW_ID).maybeSingle();
  if (error) throw error;
  return data ?? EMPTY;
}

export async function updateContact(patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, ...patch, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ?? { ...EMPTY, ...patch };
}
