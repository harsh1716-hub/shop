const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all orders
router.get('/', (req, res) => {
  db.all('SELECT * FROM advanced_orders ORDER BY pickup_date ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ orders: rows });
  });
});

// POST new order
router.post('/', (req, res) => {
  const { customer_name, customer_phone, product_details, pickup_date } = req.body;

  if (!customer_name || !product_details || !pickup_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `INSERT INTO advanced_orders (customer_name, customer_phone, product_details, pickup_date) VALUES (?, ?, ?, ?)`;
  db.run(query, [customer_name, customer_phone || '', product_details, pickup_date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Custom order booked successfully!' });
  });
});

// PUT to update status
router.put('/:id/status', (req, res) => {
  db.run(`UPDATE advanced_orders SET status = ? WHERE id = ?`, [req.body.status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status updated' });
  });
});

module.exports = router;
