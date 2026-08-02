import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getContact, updateContact } from '../db/contact.js';

export const contactRouter = Router();

const FIELDS = ['email', 'phone', 'instagram'];
const MAX_LENGTH = 200;

contactRouter.get('/', async (req, res, next) => {
  try {
    res.json({ contact: await getContact() });
  } catch (err) {
    next(err);
  }
});

contactRouter.put('/', requireAdmin, async (req, res, next) => {
  try {
    const patch = {};
    for (const field of FIELDS) {
      const value = req.body?.[field];
      if (value === undefined) continue;
      if (typeof value !== 'string') {
        return res.status(400).json({ error: `${field} must be text` });
      }
      if (value.length > MAX_LENGTH) {
        return res.status(400).json({ error: `${field} is too long` });
      }
      patch[field] = value.trim();
    }

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    res.json({ contact: await updateContact(patch) });
  } catch (err) {
    next(err);
  }
});
