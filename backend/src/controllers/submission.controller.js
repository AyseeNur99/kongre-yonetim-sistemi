import path from 'path';
import { pool } from '../config/db.js';

// file_path veritabanında tam sunucu yolu olarak tutulur (örn: "src/uploads/168...pdf").
// Tarayıcının dosyaya ulaşabilmesi için sadece dosya adını çıkarıp /uploads altında sunuyoruz.
function withFileName(row) {
  return { ...row, file_name: path.basename(row.file_path) };
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
      `SELECT s.*, t.name AS theme_name, c.title AS congress_title
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
