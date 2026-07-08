import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/congresses -> herkes görebilir (giriş yapmış kullanıcılar)
// Kongreleri ve altındaki temaları birlikte döner
router.get('/', requireAuth, async (req, res) => {
  try {
    const congresses = await pool.query('SELECT * FROM congresses ORDER BY start_date');
    const themes = await pool.query('SELECT * FROM themes');

    // Her kongrenin altına ilgili temaları yerleştiriyoruz
    const data = congresses.rows.map((c) => ({
      ...c,
      themes: themes.rows.filter((t) => t.congress_id === c.id),
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kongreler getirilirken hata oluştu.' });
  }
});

// POST /api/congresses -> sadece admin yeni kongre oluşturabilir
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, description, start_date, end_date, submission_deadline } = req.body;
  // Boş string gelen tarih alanları PostgreSQL'de hataya sebep olur, bu yüzden null'a çeviriyoruz.
  const toDateOrNull = (v) => (v && v.trim() !== '' ? v : null);
  try {
    const result = await pool.query(
      `INSERT INTO congresses (title, description, start_date, end_date, submission_deadline)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, toDateOrNull(start_date), toDateOrNull(end_date), toDateOrNull(submission_deadline)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kongre oluşturulurken hata oluştu.', detail: err.message });
  }
});

// POST /api/congresses/:id/themes -> admin, bir kongreye tema ekler
router.post('/:id/themes', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO themes (congress_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [id, name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tema oluşturulurken hata oluştu.' });
  }
});

export default router;
