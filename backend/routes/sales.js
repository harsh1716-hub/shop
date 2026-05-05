const express = require('express');
const router = express.Router();
const db = require('../database');

const GST_RATE = 0.12; // 12% GST

// GET all sales
router.get('/', (req, res) => {
  db.all('SELECT * FROM sales ORDER BY sale_date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ sales: rows });
  });
});

// POST a new sale (Handles cart checkout)
router.post('/', (req, res) => {
  const { customer_id, items } = req.body;
  
  // items should be an array of: { productId, quantity, price }
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Calculate totals
  let totalAmount = 0;
  items.forEach(item => {
    totalAmount += (item.price * item.quantity);
  });
  
  const gstAmount = parseFloat((totalAmount * GST_RATE).toFixed(2));
  const grandTotal = parseFloat((totalAmount + gstAmount).toFixed(2));

  // Run transaction to create sale and deduct stock
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const insertSaleQuery = `INSERT INTO sales (customer_id, total_amount, gst_amount, grand_total) VALUES (?, ?, ?, ?)`;
    
    db.run(insertSaleQuery, [customer_id || null, totalAmount, gstAmount, grandTotal], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      const saleId = this.lastID;
      let completedItems = 0;
      let hasError = false;

      // Insert sale items & Deduct stock
      items.forEach(item => {
        // Log the item sold
        db.run(`INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)`, 
          [saleId, item.productId, item.quantity, item.price], 
          (err) => {
            if (err) hasError = true;
          }
        );

        // Deduct from products table (Crucial part)
        db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.productId], (err) => {
          if (err) hasError = true;
          
          completedItems++;
          // When all items processed, commit or rollback
          if (completedItems === items.length) {
            if (hasError) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: 'Failed to process sale items' });
            } else {
              db.run("COMMIT");
              res.status(201).json({ 
                message: 'Sale completed successfully', 
                saleId,
                totalAmount,
                gstAmount,
                grandTotal
              });
            }
          }
        });
      });
    });
  });
});

module.exports = router;
