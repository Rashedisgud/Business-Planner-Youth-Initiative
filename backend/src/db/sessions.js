import { supabase } from './supabaseClient.js';

const TABLE = 'sessions';

export async function createSession({ userId = null } = {}) {
  const row = {
    current_stage: 1,
    current_question_index: 0,
    stage1_answers: {},
    stage2_answers: {},
    stage3_answers: {},
    stage1_feedback: null,
    user_id: userId,
  };
  const { data, error } = await supabase.from(TABLE).insert([row]).select().single();
  if (error) throw error;
  return data;
}

/**
 * Returns null when the plan isn't there, rather than throwing. A stored id can
 * outlive the row it points at - a plan deleted on another device, or an old id
 * left in a browser - and that should read as "not found", not as a crash.
 */
export async function getSession(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Null when the row vanished between reading it and writing to it. */
export async function updateSession(id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteSession(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function listSessionsForUser(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
