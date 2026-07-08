import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

// POST /api/auth/register
// Yeni kullanıcı kaydı (varsayılan rol: 'author' -> yazar/makale sahibi)
export async function register(req, res) {
  const { full_name, email, password, institution } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'İsim, e-posta ve şifre zorunludur.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Bu e-posta ile zaten bir hesap var.' });
    }

    // Şifreyi asla düz metin olarak saklamıyoruz, bcrypt ile hashliyoruz
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, institution)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, institution`,
      [full_name, email, password_hash, institution || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    // Token içine sadece gerekli bilgileri koyuyoruz (şifre hash'i asla)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
}
