import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createSubmission,
  getMySubmissions,
  getAssignedSubmissions,
} from '../controllers/submission.controller.js';

const router = Router();

// Yüklenen dosyaların nereye ve nasıl isimlendirilerek kaydedileceğini ayarlıyoruz
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'src/uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Sadece PDF ve Word dosyalarına izin ver
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Sadece PDF veya Word dosyaları yüklenebilir.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB sınır
});

// Bildiri yükleme -> sadece giriş yapmış kullanıcılar (yazarlar)
router.post('/', requireAuth, upload.single('file'), createSubmission);

// Kendi bildirilerimi listele
router.get('/mine', requireAuth, getMySubmissions);

// Hakem olarak bana atanan bildirileri listele
router.get('/assigned', requireAuth, requireRole('reviewer', 'admin'), getAssignedSubmissions);

export default router;
