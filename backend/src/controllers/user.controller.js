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

// GET /api/users/me
// Giriş yapan kullanıcının kendi profil bilgilerini görmesi (herkes kendi profilini görebilir)
export async function getMyProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, institution, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profil getirilirken hata oluştu.' });
  }
}

// PATCH /api/users/me
// Giriş yapan kullanıcının kendi ad/kurum bilgisini güncellemesi.
// E-posta ve rol buradan değiştirilemez (rol sadece admin tarafından değiştirilir).
export async function updateMyProfile(req, res) {
  const { full_name, institution } = req.body;

  if (!full_name || full_name.trim() === '') {
    return res.status(400).json({ error: 'Ad soyad boş bırakılamaz.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET full_name = $1, institution = $2 WHERE id = $3
       RETURNING id, full_name, email, role, institution, created_at`,
      [full_name, institution || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu.' });
  }
}

// GET /api/users
// Admin: sistemdeki tüm kullanıcıları (herhangi bir rolde) listeler.
// Bu liste, admin panelinde rol değiştirme (author -> reviewer -> admin) arayüzü için kullanılır.
export async function listAllUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, institution, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kullanıcılar getirilirken hata oluştu.' });
  }
}

// PATCH /api/users/:id/role
// Admin: bir kullanıcının rolünü değiştirir (author / reviewer / admin).
// Bu sayede pgAdmin'e elle SQL yazmaya gerek kalmadan, kayıt olan birini
// arayüzden hakem veya admin yapabiliyoruz.
export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ['author', 'reviewer', 'admin'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Geçersiz rol. 'author', 'reviewer' veya 'admin' olmalı." });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role`,
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Rol güncellenirken hata oluştu.' });
  }
}
