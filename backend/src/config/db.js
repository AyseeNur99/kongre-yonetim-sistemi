import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Uygulama boyunca tek bir bağlantı havuzu (pool) kullanıyoruz.
// Her sorguda yeni bağlantı açıp kapatmak yerine havuzdaki bağlantıları yeniden kullanır.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('PostgreSQL veritabanına bağlanıldı.');
});

pool.on('error', (err) => {
  console.error('Beklenmeyen veritabanı hatası:', err);
});
