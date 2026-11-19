// index.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const osintRouter = require('./routes/osint');

const app = express();

// ============================================================
//  Rate Limit: 500 request per minggu (7 hari) per IP
// ============================================================
const WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari dalam ms

const weeklyLimiter = rateLimit({
  windowMs: WEEK_MS,
  max: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Skip rate limit untuk endpoint info & health biar bisa dicek kapan aja
  skip: (req) => {
    return req.path === '/osint/osint-whatsapp' ||
           req.path === '/osint/osint-whatsapp/' ||
           req.path === '/osint/osint-whatsapp/health';
  },
  message: {
    success: false,
    message: 'Limit tercapai. Maksimal 500 request per minggu per IP.',
    limit: 500,
    window: '7 hari'
  },
  // keyGenerator default pakai req.ip — aman untuk Vercel
  validate: { trustProxy: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy — WAJIB untuk Vercel biar req.ip akurat
app.set('trust proxy', 1);

// Terapkan rate limit ke semua route OSINT
app.use('/osint/osint-whatsapp', weeklyLimiter, osintRouter);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'api-dexxshoot',
    status: 'online',
    osint_endpoint: '/osint/osint-whatsapp',
    rate_limit: '500 request / minggu / IP'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Export untuk Vercel
module.exports = app;

// Untuk testing lokal
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Dev server: http://localhost:${PORT}/osint/osint-whatsapp`);
  });
}