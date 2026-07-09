import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { listReviewers } from '../controllers/user.controller.js';

const router = Router();

// Sadece admin, sistemdeki hakem listesini görebilir (manuel atama yapabilmek için)
router.get('/reviewers', requireAuth, requireRole('admin'), listReviewers);

export default router;
