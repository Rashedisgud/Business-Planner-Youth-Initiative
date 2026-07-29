import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listReviews, createReview, updateReview, deleteReview } from '../db/reviews.js';

export const reviewsRouter = Router();

function validateReviewBody(body) {
  const { author_name, role_or_company, quote, rating } = body;
  if (typeof author_name !== 'string' || !author_name.trim()) {
    return 'author_name is required';
  }
  if (typeof quote !== 'string' || !quote.trim()) {
    return 'quote is required';
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return 'rating must be an integer between 1 and 5';
  }
  if (role_or_company !== undefined && role_or_company !== null && typeof role_or_company !== 'string') {
    return 'role_or_company must be a string';
  }
  return null;
}

reviewsRouter.get('/', async (req, res, next) => {
  try {
    const reviews = await listReviews();
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    const validationError = validateReviewBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const { author_name, role_or_company, quote, rating } = req.body;
    const review = await createReview({
      author_name: author_name.trim(),
      role_or_company: role_or_company?.trim() || null,
      quote: quote.trim(),
      rating: Number(rating),
    });
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const validationError = validateReviewBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const { author_name, role_or_company, quote, rating } = req.body;
    const review = await updateReview(req.params.id, {
      author_name: author_name.trim(),
      role_or_company: role_or_company?.trim() || null,
      quote: quote.trim(),
      rating: Number(rating),
    });
    res.json({ review });
  } catch (err) {
    next(err);
  }
});

reviewsRouter.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await deleteReview(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
