import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  listReviewers,
  listAllUsers,
  updateUserRole,
  getMyProfile,
  updateMyProfile,
} from '../controllers/user.controller.js';

const router = Router();

// Herkes kendi profilini görebilir ve düzenleyebilir (admin yetkisi gerekmez)
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Sadece admin, sistemdeki hakem listesini görebilir (manuel atama yapabilmek için)
router.get('/reviewers', requireAuth, requireRole('admin'), listReviewers);

// Sadece admin, sistemdeki tüm kullanıcıları görebilir ve rollerini değiştirebilir
router.get('/', requireAuth, requireRole('admin'), listAllUsers);
router.patch('/:id/role', requireAuth, requireRole('admin'), updateUserRole);

export default router;
