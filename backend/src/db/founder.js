import { supabase } from './supabaseClient.js';

const TABLE = 'founder';

// Fixed ids rather than a free-form list, so the backend always knows which row
// it is addressing and the page renders the two people in a stable order.
export const FOUNDER_ID = 1;
export const COFOUNDER_ID = 2;
export const PERSON_IDS = [FOUNDER_ID, COFOUNDER_ID];

export function isPersonId(value) {
  return PERSON_IDS.includes(Number(value));
}

function emptyPerson(id) {
  return { id, name: '', bio: '', photo_url: null, updated_at: null };
}

/**
 * Both people, always in id order, and always both present. A project whose
 * database predates the co-founder row gets a blank one rather than an error,
 * so the page renders either way.
 */
export async function listPeople() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('id', PERSON_IDS)
    .order('id');
  if (error) throw error;

  return PERSON_IDS.map((id) => data?.find((row) => row.id === id) ?? emptyPerson(id));
}

export async function getFounder(id = FOUNDER_ID) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ?? emptyPerson(id);
}

/** Creates the row if it isn't there yet, so first-time editing works. */
export async function updateFounderInfo(patch, id = FOUNDER_ID) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ id, ...patch, updated_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ?? { ...emptyPerson(id), ...patch };
}
