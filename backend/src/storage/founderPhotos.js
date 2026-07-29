import { supabase } from '../db/supabaseClient.js';

const BUCKET = 'founder-photos';

export async function ensureFounderBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) return;

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
  });
  // Ignore a race where another process created it between the list and create calls.
  if (createErr && !/already exists/i.test(createErr.message)) {
    throw createErr;
  }
}

export async function uploadFounderPhoto(buffer, mimeType, personId = 1) {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  // Person 1 keeps the original filename so photos uploaded before the
  // co-founder existed are not orphaned.
  const path = personId === 1 ? `founder.${ext}` : `founder-${personId}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the browser picks up the new photo immediately after a re-upload.
  return `${data.publicUrl}?v=${Date.now()}`;
}
