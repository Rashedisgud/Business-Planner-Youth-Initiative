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

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}
