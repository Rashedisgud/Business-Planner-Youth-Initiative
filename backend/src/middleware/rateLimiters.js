import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

// These limits are per IP address. Remember that whole schools, offices, and
// mobile carriers often share a single public IP, so a "reasonable per-person"
// number would lock out an entire classroom. One completed plan costs 17
// answers, so the limits below are sized to let a room full of people work
// through plans at once while still stopping a script from hammering the
// OpenAI-backed endpoints.

export const sessionCreateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many plans started from this network - please try again in a few minutes.' },
});

export const answerLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests - please slow down and try again shortly.' },
});
