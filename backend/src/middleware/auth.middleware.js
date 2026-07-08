import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Bu middleware, isteğin header'ındaki JWT token'ı kontrol eder.
// Token geçerliyse req.user içine kullanıcı bilgisini koyar ve devam eder.
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']; // "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı, giriş yapmalısınız.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token geçersiz veya süresi dolmuş.' });
    }
    req.user = user; // { id, email, role }
    next();
  });
}

// Belirli rollere sahip kullanıcıların erişimine izin veren middleware üreticisi.
// Kullanımı: requireRole('admin') veya requireRole('admin', 'reviewer')
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    next();
  };
}
