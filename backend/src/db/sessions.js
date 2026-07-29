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

export async function getSession(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSession(id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
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
