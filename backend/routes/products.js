const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all products
router.get('/', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ products: rows });
  });
});

// GET a single product by barcode (useful for POS scanner)
router.get('/barcode/:barcode', (req, res) => {
  db.get('SELECT * FROM products WHERE barcode = ?', [req.params.barcode], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

// POST to add new product
router.post('/', (req, res) => {
  const { name, price, stock, threshold, barcode, category, is_raw_material } = req.body;
  
  if (!name || price == null || stock == null) {
    return res.status(400).json({ error: 'Name, price, and stock are required.' });
  }

  const query = `INSERT INTO products (name, price, stock, threshold, barcode, category, is_raw_material) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [
    name, price, stock,
    threshold || 10,
    barcode || null,
    category || 'Uncategorized',
    is_raw_material || 0
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Product added successfully' });
  });
});

// PUT to update product
router.put('/:id', (req, res) => {
  const { name, price, stock, threshold, barcode, category, is_raw_material } = req.body;
  const query = `UPDATE products SET name = ?, price = ?, stock = ?, threshold = ?, barcode = ?, category = ?, is_raw_material = ? WHERE id = ?`;
  
  db.run(query, [name, price, stock, threshold, barcode, category || 'Uncategorized', is_raw_material || 0, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Product updated successfully', changes: this.changes });
  });
});

module.exports = router;
