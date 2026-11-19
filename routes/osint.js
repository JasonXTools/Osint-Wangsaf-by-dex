// routes/osint.js
const express = require('express');
const router = express.Router();
const osint = require('../database');

const BASE_URL = process.env.BASE_URL || 'https://api-dexxshoot.vercel.app';
const PATH = '/osint/osint-whatsapp';

// GET /osint/osint-whatsapp — info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'OSINT WhatsApp API',
    version: '1.0.0',
    description: 'OSINT WhatsApp Number Intelligence API',
    base_url: `${BASE_URL}${PATH}`,
    rate_limit: {
      limit: 500,
      window: '7 hari',
      per: 'IP address',
      note: 'Endpoint info & health tidak dihitung'
    },
    endpoints: {
      info:      `${BASE_URL}${PATH}`,
      lookupGet: `${BASE_URL}${PATH}/08123456789`,
      lookupPost:`${BASE_URL}${PATH}`,
      lookupBulk:`${BASE_URL}${PATH}/bulk`,
      health:    `${BASE_URL}${PATH}/health`
    }
  });
});

// GET /osint/osint-whatsapp/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET /osint/osint-whatsapp/:nomor
router.get('/:nomor', (req, res) => {
  try {
    const nomor = decodeURIComponent(req.params.nomor);
    const result = osint.lookup(nomor);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses nomor',
      error: err.message
    });
  }
});

// POST /osint/osint-whatsapp
router.post('/', (req, res) => {
  try {
    const { nomor } = req.body;
    if (!nomor) {
      return res.status(400).json({ success: false, message: 'Field "nomor" wajib diisi' });
    }
    const result = osint.lookup(nomor);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses nomor',
      error: err.message
    });
  }
});

// POST /osint/osint-whatsapp/bulk
router.post('/bulk', (req, res) => {
  try {
    const { nomor } = req.body;
    if (!Array.isArray(nomor) || nomor.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Field "nomor" harus array dan tidak kosong'
      });
    }
    if (nomor.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maksimal 50 nomor per request'
      });
    }
    const results = nomor.map((n) => ({ input: n, ...osint.lookup(n) }));
    return res.json({ success: true, total: results.length, data: results });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses nomor',
      error: err.message
    });
  }
});

module.exports = router;
