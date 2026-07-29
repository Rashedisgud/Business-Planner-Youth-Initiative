import { supabase } from './supabaseClient.js';

const TABLE = 'reviews';

export async function listReviews() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createReview({ author_name, role_or_company, quote, rating }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ author_name, role_or_company, quote, rating }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReview(id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReview(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
