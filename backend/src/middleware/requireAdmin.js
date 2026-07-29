import crypto from 'node:crypto';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server.' });
  }

  const provided = req.headers['x-admin-password'];
  if (!provided || !timingSafeEqual(provided, configured)) {
    return res.status(403).json({ error: 'Incorrect admin password.' });
  }

  next();
}
