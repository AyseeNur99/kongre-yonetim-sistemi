import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { submitReview, getReviewSummary } from '../controllers/review.controller.js';

const router = Router();

// Hakem, bir bildiriye onay/red kararı verir
router.post('/', requireAuth, requireRole('reviewer', 'admin'), submitReview);

// Bir bildirinin oy özetini görüntüle
router.get('/:submissionId/summary', requireAuth, getReviewSummary);

export default router;
