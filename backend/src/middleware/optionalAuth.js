import { supabase } from '../db/supabaseClient.js';

// Attaches req.user = { id, email } when a valid Supabase access token is
// provided via Authorization: Bearer <token>. Never blocks the request -
// anonymous users simply get req.user = null, preserving the no-account-needed
// free flow.
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.slice('Bearer '.length);
  const { data, error } = await supabase.auth.getUser(token);
  req.user = error ? null : { id: data.user.id, email: data.user.email };
  next();
}

// Assumes optionalAuth already ran (mounted globally in app.js) and populated req.user.
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  next();
}
