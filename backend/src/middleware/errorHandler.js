import multer from 'multer';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be under 5MB.' : `Upload error: ${err.message}`;
    return res.status(400).json({ error: message });
  }

  if (err.message?.startsWith('Origin not allowed by CORS')) {
    return res.status(403).json({
      error: 'This site is not allowed to call the API. Check FRONTEND_URL on the backend.',
    });
  }

  if (err.code === 'PGRST205') {
    return res.status(503).json({
      error: "The database isn't fully set up yet - run supabase/schema.sql in the Supabase SQL editor.",
    });
  }

  // PGRST116 is "expected one row, got none". Callers should be using
  // maybeSingle and returning a 404 themselves; this is a backstop so the raw
  // "Cannot coerce the result to a single JSON object" can never reach anyone.
  if (err.code === 'PGRST116') {
    return res.status(404).json({
      error: "That plan no longer exists. Start a new one and you'll be on your way.",
    });
  }

  // 23514 is a check-constraint violation. The only one here is the founder
  // table still limited to a single row, which means the co-founder migration
  // hasn't been run on this database yet.
  if (err.code === '23514' && /founder/i.test(err.message ?? '')) {
    return res.status(503).json({
      error:
        "This database still has the older single-person founder table. Re-run supabase/schema.sql in the Supabase SQL editor to add the co-founder, then try again.",
    });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}
