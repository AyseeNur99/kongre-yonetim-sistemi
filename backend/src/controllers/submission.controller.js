import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';

// file_path veritabanında tam sunucu yolu olarak tutulur (örn: "src/uploads/168...pdf").
// Tarayıcının dosyaya ulaşabilmesi için sadece dosya adını çıkarıp /uploads altında sunuyoruz.
// Ayrıca PostgreSQL'den COUNT() sonuçları string olarak gelir (bigint), sayıya çeviriyoruz.
function withFileName(row) {
  return {
    ...row,
    file_name: path.basename(row.file_path),
    ...(row.total_reviewers !== undefined && {
      total_reviewers: parseInt(row.total_reviewers, 10),
      approved_count: parseInt(row.approved_count, 10),
      rejected_count: parseInt(row.rejected_count, 10),
    }),
  };
}

// POST /api/submissions
// Yazar bir bildiri/makale yükler ve belirli bir temaya bağlar.
// Not: dosyanın kendisi multer middleware'i tarafından req.file içine konur.
export async function createSubmission(req, res) {
  const author_id = req.user.id;
  const { theme_id, title, abstract } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Bir dosya yüklemelisiniz (PDF/DOCX).' });
  }

  try {
    // Temanın bağlı olduğu kongrenin son başvuru tarihini kontrol ediyoruz.
    // submission_deadline boş bırakılmışsa (null) süre sınırı yok kabul edilir.
    const themeInfo = await pool.query(
      `SELECT c.submission_deadline
       FROM themes t
       JOIN congresses c ON t.congress_id = c.id
       WHERE t.id = $1`,
      [theme_id]
    );

    if (themeInfo.rows.length === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Geçersiz tema seçildi.' });
    }

    const deadline = themeInfo.rows[0].submission_deadline;
    if (deadline && new Date() > new Date(deadline)) {
      // Süre geçtiyse yüklenen dosyayı diskte bırakmıyoruz, temizliyoruz.
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: `Bu kongre için son başvuru tarihi (${new Date(deadline).toLocaleDateString('tr-TR')}) geçmiş, bildiri gönderilemez.`,
      });
    }

    const file_path = req.file.path;

    const result = await pool.query(
      `INSERT INTO submissions (author_id, theme_id, title, abstract, file_path)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [author_id, theme_id, title, abstract, file_path]
    );

    const submission = result.rows[0];

    // Bildiri yüklenir yüklenmez otomatik olarak 10 hakem atıyoruz.
    // (Basit yaklaşım: sistemdeki 'reviewer' rolündeki kullanıcılardan rastgele 10 tanesi)
    await assignReviewersToSubmission(submission.id);

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bildiri yüklenirken hata oluştu.' });
  }
}

// Yardımcı fonksiyon: bir bildiriye rastgele 10 hakem atar
async function assignReviewersToSubmission(submissionId) {
  const reviewers = await pool.query(
    `SELECT id FROM users WHERE role = 'reviewer' ORDER BY RANDOM() LIMIT 10`
  );

  const insertPromises = reviewers.rows.map((r) =>
    pool.query(
      `INSERT INTO reviewer_assignments (submission_id, reviewer_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [submissionId, r.id]
    )
  );

  await Promise.all(insertPromises);
}

// GET /api/submissions/mine
// Giriş yapan kullanıcının kendi yüklediği tüm bildirileri (birden fazla olabilir)
export async function getMySubmissions(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.*, t.name AS theme_name, c.title AS congress_title,
              (SELECT COUNT(*) FROM reviewer_assignments ra WHERE ra.submission_id = s.id) AS total_reviewers,
              (SELECT COUNT(*) FROM reviews r WHERE r.submission_id = s.id AND r.decision = 'approved') AS approved_count,
              (SELECT COUNT(*) FROM reviews r WHERE r.submission_id = s.id AND r.decision = 'rejected') AS rejected_count
       FROM submissions s
       JOIN themes t ON s.theme_id = t.id
       JOIN congresses c ON t.congress_id = c.id
       WHERE s.author_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(withFileName));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bildiriler getirilirken hata oluştu.' });
  }
}

// GET /api/submissions/assigned
// Giriş yapan hakemin, kendisine atanmış bildirileri görmesi
export async function getAssignedSubmissions(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.*, u.full_name AS author_name,
              EXISTS(
                SELECT 1 FROM reviews r
                WHERE r.submission_id = s.id AND r.reviewer_id = $1
              ) AS already_reviewed
       FROM reviewer_assignments ra
       JOIN submissions s ON ra.submission_id = s.id
       JOIN users u ON s.author_id = u.id
       WHERE ra.reviewer_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(withFileName));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Atanan bildiriler getirilirken hata oluştu.' });
  }
}

// GET /api/submissions/all
// Admin: sistemdeki tüm bildirileri, atanan hakemleri ve oy durumlarıyla birlikte listeler
export async function getAllSubmissionsForAdmin(req, res) {
  try {
    const subs = await pool.query(
      `SELECT s.*, u.full_name AS author_name, t.name AS theme_name, c.title AS congress_title
       FROM submissions s
       JOIN users u ON s.author_id = u.id
       JOIN themes t ON s.theme_id = t.id
       JOIN congresses c ON t.congress_id = c.id
       ORDER BY s.submitted_at DESC`
    );

    const assignments = await pool.query(
      `SELECT ra.submission_id, ra.reviewer_id, u.full_name AS reviewer_name,
              r.decision
       FROM reviewer_assignments ra
       JOIN users u ON ra.reviewer_id = u.id
       LEFT JOIN reviews r ON r.submission_id = ra.submission_id AND r.reviewer_id = ra.reviewer_id`
    );

    const data = subs.rows.map(withFileName).map((s) => ({
      ...s,
      reviewers: assignments.rows.filter((a) => a.submission_id === s.id),
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bildiriler getirilirken hata oluştu.' });
  }
}

// POST /api/submissions/:id/reviewers
// Admin: bir bildiriye manuel olarak bir hakem atar
export async function assignReviewer(req, res) {
  const { id } = req.params;
  const { reviewer_id } = req.body;
  try {
    // Seçilen kullanıcının gerçekten 'reviewer' rolünde olduğunu doğrula
    const reviewer = await pool.query(`SELECT id FROM users WHERE id = $1 AND role = 'reviewer'`, [reviewer_id]);
    if (reviewer.rows.length === 0) {
      return res.status(400).json({ error: 'Seçilen kullanıcı bir hakem değil.' });
    }

    await pool.query(
      `INSERT INTO reviewer_assignments (submission_id, reviewer_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, reviewer_id]
    );
    res.status(201).json({ message: 'Hakem atandı.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hakem atanırken hata oluştu.' });
  }
}

// DELETE /api/submissions/:id/reviewers/:reviewerId
// Admin: bir hakemin atamasını kaldırır (henüz oy vermediyse)
export async function unassignReviewer(req, res) {
  const { id, reviewerId } = req.params;
  try {
    const existingVote = await pool.query(
      `SELECT id FROM reviews WHERE submission_id = $1 AND reviewer_id = $2`,
      [id, reviewerId]
    );
    if (existingVote.rows.length > 0) {
      return res.status(400).json({ error: 'Bu hakem zaten oy vermiş, atama kaldırılamaz.' });
    }

    await pool.query(
      `DELETE FROM reviewer_assignments WHERE submission_id = $1 AND reviewer_id = $2`,
      [id, reviewerId]
    );
    res.json({ message: 'Hakem ataması kaldırıldı.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Atama kaldırılırken hata oluştu.' });
  }
}

// DELETE /api/submissions/:id
// Yazar, kendi bildirisini silebilir — ama SADECE henüz hiçbir hakem oy vermediyse.
// Aksi halde bir hakemin verdiği kararı ortadan kaldırmış oluruz, bu veri bütünlüğünü bozar.
export async function deleteSubmission(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const submission = await pool.query(`SELECT * FROM submissions WHERE id = $1`, [id]);
    if (submission.rows.length === 0) {
      return res.status(404).json({ error: 'Bildiri bulunamadı.' });
    }

    const sub = submission.rows[0];

    // Sadece bildirinin sahibi (ya da admin) silebilir
    if (sub.author_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu bildiriyi silme yetkiniz yok.' });
    }

    const reviewCount = await pool.query(`SELECT COUNT(*) FROM reviews WHERE submission_id = $1`, [id]);
    if (parseInt(reviewCount.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Bu bildiriye en az bir hakem oy verdiği için artık silinemez.',
      });
    }

    // Veritabanı kaydını sil (reviewer_assignments otomatik olarak CASCADE ile silinir)
    await pool.query(`DELETE FROM submissions WHERE id = $1`, [id]);

    // Diskteki dosyayı da temizle (hata olursa sessizce geç, kritik değil)
    fs.unlink(sub.file_path, () => {});

    res.json({ message: 'Bildiri silindi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bildiri silinirken hata oluştu.' });
  }
}

// PATCH /api/submissions/:id
// Yazar, kendi bildirisinin başlığını/özetini düzenleyebilir, isterse dosyayı değiştirebilir.
// Silmede olduğu gibi aynı kural geçerli: henüz hiç hakem oy vermediyse düzenlenebilir.
export async function updateSubmission(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, abstract } = req.body;

  try {
    const submission = await pool.query(`SELECT * FROM submissions WHERE id = $1`, [id]);
    if (submission.rows.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Bildiri bulunamadı.' });
    }

    const sub = submission.rows[0];

    if (sub.author_id !== userId && req.user.role !== 'admin') {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({ error: 'Bu bildiriyi düzenleme yetkiniz yok.' });
    }

    const reviewCount = await pool.query(`SELECT COUNT(*) FROM reviews WHERE submission_id = $1`, [id]);
    if (parseInt(reviewCount.rows[0].count, 10) > 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: 'Bu bildiriye en az bir hakem oy verdiği için artık düzenlenemez.',
      });
    }

    // Yeni bir dosya yüklendiyse eskisini diskten sil, yenisini kullan.
    // Yüklenmediyse mevcut dosya yolunu koru.
    const newFilePath = req.file ? req.file.path : sub.file_path;
    if (req.file) fs.unlink(sub.file_path, () => {});

    const result = await pool.query(
      `UPDATE submissions SET title = $1, abstract = $2, file_path = $3 WHERE id = $4 RETURNING *`,
      [title ?? sub.title, abstract ?? sub.abstract, newFilePath, id]
    );

    res.json(withFileName(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bildiri güncellenirken hata oluştu.' });
  }
}
