import { pool } from '../config/db.js';

// POST /api/reviews
// Bir hakem, kendisine atanmış bir bildiriye onay/red kararı verir.
export async function submitReview(req, res) {
  const reviewer_id = req.user.id;
  const { submission_id, decision, comment } = req.body; // decision: 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: "decision alanı 'approved' veya 'rejected' olmalı." });
  }

  try {
    // Bu hakem gerçekten bu bildiriye atanmış mı kontrol et
    const assignment = await pool.query(
      `SELECT * FROM reviewer_assignments WHERE submission_id = $1 AND reviewer_id = $2`,
      [submission_id, reviewer_id]
    );
    if (assignment.rows.length === 0) {
      return res.status(403).json({ error: 'Bu bildiriyi değerlendirme yetkiniz yok.' });
    }

    // Oyu kaydet (bir hakem aynı bildiriye sadece bir kez oy verebilir - UNIQUE kısıtı var)
    await pool.query(
      `INSERT INTO reviews (submission_id, reviewer_id, decision, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (submission_id, reviewer_id)
       DO UPDATE SET decision = $3, comment = $4, reviewed_at = NOW()`,
      [submission_id, reviewer_id, decision, comment || null]
    );

    // Tüm oylar tamamlandıysa (10 hakemin hepsi oy verdiyse) nihai kararı belirle
    await finalizeDecisionIfComplete(submission_id);

    res.json({ message: 'Değerlendirmeniz kaydedildi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Değerlendirme kaydedilirken hata oluştu.' });
  }
}

// Yardımcı fonksiyon: 10 hakemin tamamı oy kullandıysa, çoğunluğa göre
// bildirinin nihai durumunu 'accepted' veya 'rejected' olarak günceller.
async function finalizeDecisionIfComplete(submissionId) {
  const totalAssigned = await pool.query(
    `SELECT COUNT(*) FROM reviewer_assignments WHERE submission_id = $1`,
    [submissionId]
  );
  const totalReviewed = await pool.query(
    `SELECT decision, COUNT(*) FROM reviews WHERE submission_id = $1 GROUP BY decision`,
    [submissionId]
  );

  const assignedCount = parseInt(totalAssigned.rows[0].count, 10);
  const reviewedCount = totalReviewed.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

  // Henüz herkes oy vermediyse bekle, karar verme
  if (reviewedCount < assignedCount) return;

  const approvedRow = totalReviewed.rows.find((r) => r.decision === 'approved');
  const approvedCount = approvedRow ? parseInt(approvedRow.count, 10) : 0;

  // Basit çoğunluk kuralı: onayların yarısından fazlaysa kabul edilir
  const finalStatus = approvedCount > assignedCount / 2 ? 'accepted' : 'rejected';

  await pool.query(`UPDATE submissions SET status = $1 WHERE id = $2`, [finalStatus, submissionId]);
}

// GET /api/reviews/:submissionId/summary
// Bir bildirinin şu ana kadarki oy durumunu görmek için (admin/yazar için)
export async function getReviewSummary(req, res) {
  const { submissionId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.decision, COUNT(*) FROM reviews r WHERE r.submission_id = $1 GROUP BY r.decision`,
      [submissionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Özet getirilirken hata oluştu.' });
  }
}
