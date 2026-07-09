import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import congressRoutes from './routes/congress.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import reviewRoutes from './routes/review.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Yüklenen bildiri dosyalarına (PDF/Word) tarayıcıdan erişim için statik sunum.
// Örn: http://localhost:5000/uploads/168...pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route'ları bağlıyoruz
app.use('/api/auth', authRoutes);
app.use('/api/congresses', congressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Kongre Yönetim Sistemi API çalışıyor.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
