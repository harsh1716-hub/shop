const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/bakery/freshness
router.get('/freshness', (req, res) => {
  db.all(`
    SELECT b.*, p.name 
    FROM batches b 
    JOIN products p ON b.product_id = p.id 
    WHERE b.remaining_quantity > 0 
    ORDER BY b.expiry_date ASC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ batches: rows });
  });
});

// POST /api/bakery/bake
// Deducts raw materials and creates a new batch
router.post('/bake', (req, res) => {
  const { productId, quantityToBake, expiryDays } = req.body;

  if (!productId || !quantityToBake || !expiryDays) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Get Recipe
    db.get(`SELECT id FROM recipes WHERE final_product_id = ?`, [productId], (err, recipe) => {
      if (err || !recipe) {
        db.run("ROLLBACK");
        return res.status(err ? 500 : 404).json({ error: 'Recipe not found for this product.' });
      }

      // 2. Get Ingredients
      db.all(`SELECT ingredient_product_id, quantity_needed FROM recipe_ingredients WHERE recipe_id = ?`, [recipe.id], (err, ingredients) => {
        if (err || ingredients.length === 0) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: 'No ingredients found for recipe.' });
        }

        let hasError = false;
        let checksCompleted = 0;

        // 3. Deduct Stock
        ingredients.forEach(ing => {
          const totalNeeded = ing.quantity_needed * quantityToBake;
          
          db.get(`SELECT stock, name FROM products WHERE id = ?`, [ing.ingredient_product_id], (err, item) => {
            if (err || !item || item.stock < totalNeeded) {
              hasError = true;
              db.run("ROLLBACK");
              return res.status(400).json({ error: `Not enough stock for ingredient ${item ? item.name : 'Unknown'}. Needed: ${totalNeeded}` });
            }

            db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [totalNeeded, ing.ingredient_product_id], (err) => {
              if (err) hasError = true;
              
              checksCompleted++;
              if (checksCompleted === ingredients.length && !hasError) {
                // 4. Create Batch & Add Stock to Final Product
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

                db.run(`INSERT INTO batches (product_id, expiry_date, original_quantity, remaining_quantity) VALUES (?, ?, ?, ?)`, 
                  [productId, expiryDate.toISOString(), quantityToBake, quantityToBake], 
                  (err) => {
                    if (err) {
                      db.run("ROLLBACK");
                      return res.status(500).json({ error: 'Failed to create batch' });
                    }
                    
                    db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, [quantityToBake, productId], (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: 'Failed to update final product stock' });
                      }

                      db.run("COMMIT");
                      res.status(201).json({ message: 'Successfully baked and added to inventory!' });
                    });
                });
              }
            });
          });
        });
      });
    });
  });
});

module.exports = router;
