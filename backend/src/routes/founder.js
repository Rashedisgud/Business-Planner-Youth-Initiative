import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getFounder,
  listPeople,
  updateFounderInfo,
  isPersonId,
  FOUNDER_ID,
} from '../db/founder.js';
import { uploadFounderPhoto } from '../storage/founderPhotos.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const founderRouter = Router();

/**
 * Which person a request is about. Defaults to the founder, so the original
 * endpoints keep behaving exactly as they did.
 */
function personIdFrom(req) {
  const raw = req.query.person ?? req.body?.person;
  if (raw === undefined || raw === null || raw === '') return FOUNDER_ID;
  return isPersonId(raw) ? Number(raw) : null;
}

founderRouter.get('/', async (req, res, next) => {
  try {
    const founder = await getFounder(FOUNDER_ID);
    // `people` is what the site reads now; `founder` stays so a browser holding
    // the previous frontend keeps working while a deploy rolls out.
    const people = await listPeople();
    res.json({ founder, people });
  } catch (err) {
    next(err);
  }
});

founderRouter.post('/verify', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

founderRouter.put('/', requireAdmin, async (req, res, next) => {
  try {
    const personId = personIdFrom(req);
    if (personId === null) return res.status(400).json({ error: 'Unknown person' });

    const { name, bio } = req.body;
    if (typeof name !== 'string' || typeof bio !== 'string') {
      return res.status(400).json({ error: 'name and bio must be strings' });
    }
    const founder = await updateFounderInfo({ name: name.trim(), bio: bio.trim() }, personId);
    res.json({ founder });
  } catch (err) {
    next(err);
  }
});

founderRouter.post('/photo', requireAdmin, upload.single('photo'), async (req, res, next) => {
  try {
    const personId = personIdFrom(req);
    if (personId === null) return res.status(400).json({ error: 'Unknown person' });

    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }
    const photoUrl = await uploadFounderPhoto(req.file.buffer, req.file.mimetype, personId);
    const founder = await updateFounderInfo({ photo_url: photoUrl }, personId);
    res.json({ founder });
  } catch (err) {
    next(err);
  }
});
