import express from 'express';
import cors from 'cors';
import { sessionRouter } from './routes/session.js';
import { pdfRouter } from './routes/pdf.js';
import { founderRouter } from './routes/founder.js';
import { reviewsRouter } from './routes/reviews.js';
import { optionalAuth } from './middleware/optionalAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

// FRONTEND_URL accepts a comma-separated list so the deployed site can be
// reached on more than one hostname - e.g. both the apex domain and the www
// subdomain, plus the *.vercel.app URL. Requests with no Origin header (curl,
// health checks, server-to-server) are allowed through as well.
function corsOrigin(origin, callback) {
  const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (!origin || allowed.includes(origin.replace(/\/$/, ''))) {
    return callback(null, true);
  }
  return callback(new Error(`Origin not allowed by CORS: ${origin}`));
}

export function createApp() {
  const app = express();

  // Needed for correct client IP detection (rate limiting) once this runs
  // behind a reverse proxy like Vercel/Railway/Render.
  app.set('trust proxy', 1);

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use(optionalAuth);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/sessions', pdfRouter);
  app.use('/api/founder', founderRouter);
  app.use('/api/reviews', reviewsRouter);

  app.use(errorHandler);
  return app;
}
