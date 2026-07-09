import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { listReviewers, listAllUsers, updateUserRole } from '../controllers/user.controller.js';

const router = Router();

// Sadece admin, sistemdeki hakem listesini görebilir (manuel atama yapabilmek için)
router.get('/reviewers', requireAuth, requireRole('admin'), listReviewers);

// Sadece admin, sistemdeki tüm kullanıcıları görebilir ve rollerini değiştirebilir
router.get('/', requireAuth, requireRole('admin'), listAllUsers);
router.patch('/:id/role', requireAuth, requireRole('admin'), updateUserRole);

export default router;
