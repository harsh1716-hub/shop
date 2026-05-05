const express = require('express');
const router = express.Router();

// Simple mock authentication for the Bakery Management System
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    return res.json({ success: true, token: 'fake-jwt-token-admin', user: { name: 'Admin Bakery Manager' } });
  }
  
  return res.status(401).json({ error: 'Invalid credentials. Use admin / admin123' });
});

module.exports = router;
