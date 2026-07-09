import { pool } from '../config/db.js';

// GET /api/users/reviewers
// Admin: sistemdeki tüm hakemleri (reviewer rolündeki kullanıcıları) listeler.
// Bu liste, admin panelinde "hangi hakemi atayayım" seçimini yapmak için kullanılır.
export async function listReviewers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, institution FROM users WHERE role = 'reviewer' ORDER BY full_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hakemler getirilirken hata oluştu.' });
  }
}
