import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getFounder, updateFounderInfo } from '../db/founder.js';
import { uploadFounderPhoto } from '../storage/founderPhotos.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const founderRouter = Router();

founderRouter.get('/', async (req, res, next) => {
  try {
    const founder = await getFounder();
    res.json({ founder });
  } catch (err) {
    next(err);
  }
});

founderRouter.post('/verify', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

founderRouter.put('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    if (typeof name !== 'string' || typeof bio !== 'string') {
      return res.status(400).json({ error: 'name and bio must be strings' });
    }
    const founder = await updateFounderInfo({ name: name.trim(), bio: bio.trim() });
    res.json({ founder });
  } catch (err) {
    next(err);
  }
});

founderRouter.post('/photo', requireAdmin, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }
    const photoUrl = await uploadFounderPhoto(req.file.buffer, req.file.mimetype);
    const founder = await updateFounderInfo({ photo_url: photoUrl });
    res.json({ founder });
  } catch (err) {
    next(err);
  }
});
