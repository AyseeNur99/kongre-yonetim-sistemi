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

// PATCH /api/congresses/:id -> admin, kongre bilgilerini düzenler
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, submission_deadline } = req.body;
  const toDateOrNull = (v) => (v && v.trim() !== '' ? v : null);
  try {
    const result = await pool.query(
      `UPDATE congresses
       SET title = $1, description = $2, start_date = $3, end_date = $4, submission_deadline = $5
       WHERE id = $6 RETURNING *`,
      [title, description, toDateOrNull(start_date), toDateOrNull(end_date), toDateOrNull(submission_deadline), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kongre bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kongre güncellenirken hata oluştu.' });
  }
});

// GET /api/congresses/:id/delete-impact -> admin, bir kongreyi silmeden önce
// kaç tema ve kaç bildirinin de silineceğini görmesi için (CASCADE etkisini önceden göstermek amacıyla)
router.get('/:id/delete-impact', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const themeCount = await pool.query(`SELECT COUNT(*) FROM themes WHERE congress_id = $1`, [id]);
    const submissionCount = await pool.query(
      `SELECT COUNT(*) FROM submissions s JOIN themes t ON s.theme_id = t.id WHERE t.congress_id = $1`,
      [id]
    );
    res.json({
      themeCount: parseInt(themeCount.rows[0].count, 10),
      submissionCount: parseInt(submissionCount.rows[0].count, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Etki hesaplanırken hata oluştu.' });
  }
});

// DELETE /api/congresses/:id -> admin, kongreyi (ve CASCADE ile altındaki tema/bildirileri) siler
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM congresses WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kongre bulunamadı.' });
    res.json({ message: 'Kongre silindi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kongre silinirken hata oluştu.' });
  }
});

// PATCH /api/congresses/:congressId/themes/:themeId -> admin, tema bilgilerini düzenler
router.patch('/:congressId/themes/:themeId', requireAuth, requireRole('admin'), async (req, res) => {
  const { themeId } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE themes SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name, description, themeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tema bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tema güncellenirken hata oluştu.' });
  }
});

// GET /api/congresses/:congressId/themes/:themeId/delete-impact -> admin, tema silmeden önce kaç bildirinin etkileneceğini gösterir
router.get('/:congressId/themes/:themeId/delete-impact', requireAuth, requireRole('admin'), async (req, res) => {
  const { themeId } = req.params;
  try {
    const submissionCount = await pool.query(`SELECT COUNT(*) FROM submissions WHERE theme_id = $1`, [themeId]);
    res.json({ submissionCount: parseInt(submissionCount.rows[0].count, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Etki hesaplanırken hata oluştu.' });
  }
});

// DELETE /api/congresses/:congressId/themes/:themeId -> admin, temayı (ve altındaki bildirileri) siler
router.delete('/:congressId/themes/:themeId', requireAuth, requireRole('admin'), async (req, res) => {
  const { themeId } = req.params;
  try {
    const result = await pool.query(`DELETE FROM themes WHERE id = $1 RETURNING id`, [themeId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tema bulunamadı.' });
    res.json({ message: 'Tema silindi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tema silinirken hata oluştu.' });
  }
});

export default router;
