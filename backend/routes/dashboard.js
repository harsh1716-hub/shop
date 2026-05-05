const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/dashboard - all live stats for the dashboard
router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Run all queries in parallel
  const results = {};

  // 1. Total Sales Today
  db.get(
    `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
     FROM sales WHERE DATE(sale_date) = DATE('now', 'localtime')`,
    [],
    (err, row) => {
      results.today = row || { total: 0, count: 0 };

      // 2. Total Sales This Week (last 7 days) grouped by day
      db.all(
        `SELECT strftime('%w', sale_date) as dow,
                SUM(grand_total) as revenue
         FROM sales
         WHERE sale_date >= DATE('now', '-6 days', 'localtime')
         GROUP BY dow ORDER BY dow`,
        [],
        (err2, weekRows) => {
          results.weekSales = weekRows || [];

          // 3. Estimated profit (assume 30% margin on grand_total)
          db.get(
            `SELECT COALESCE(SUM(grand_total) * 0.30, 0) as profit
             FROM sales WHERE DATE(sale_date) = DATE('now', 'localtime')`,
            [],
            (err3, profitRow) => {
              results.todayProfit = profitRow?.profit || 0;

              // 4. Total Baked Goods (non-raw-material products total stock)
              db.get(
                `SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE is_raw_material = 0`,
                [],
                (err4, bakedRow) => {
                  results.totalBaked = bakedRow?.total || 0;

                  // 5. Low Stock Products
                  db.all(
                    `SELECT name, stock, threshold FROM products
                     WHERE is_raw_material = 0 AND stock <= threshold
                     ORDER BY stock ASC LIMIT 5`,
                    [],
                    (err5, lowStock) => {
                      results.lowStock = lowStock || [];

                      // 6. Pending Advanced Orders
                      db.get(
                        `SELECT COUNT(*) as count FROM advanced_orders WHERE status = 'Pending'`,
                        [],
                        (err6, ordersRow) => {
                          results.pendingOrders = ordersRow?.count || 0;

                          // 7. Daily profits this week (Mon-Sun labels)
                          db.all(
                            `SELECT strftime('%w', sale_date) as dow,
                                    COALESCE(SUM(grand_total) * 0.30, 0) as profit
                             FROM sales
                             WHERE sale_date >= DATE('now', '-6 days', 'localtime')
                             GROUP BY dow`,
                            [],
                            (err7, profitRows) => {
                              results.weekProfit = profitRows || [];

                              res.json(results);
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
