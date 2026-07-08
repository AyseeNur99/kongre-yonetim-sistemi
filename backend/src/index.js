import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import congressRoutes from './routes/congress.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import reviewRoutes from './routes/review.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Route'ları bağlıyoruz
app.use('/api/auth', authRoutes);
app.use('/api/congresses', congressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Kongre Yönetim Sistemi API çalışıyor.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
