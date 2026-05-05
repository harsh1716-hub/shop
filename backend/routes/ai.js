require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../database');
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_INSIGHTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper: sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Fetch business snapshot from DB
function getBusinessSnapshot() {
  return new Promise((resolve, reject) => {
    const snapshot = {};

    db.serialize(() => {
      // 1. Top 5 best-selling products
      db.all(`
        SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.quantity * si.price_at_sale) as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY si.product_id
        ORDER BY total_sold DESC
        LIMIT 5
      `, [], (err, rows) => {
        snapshot.topSellers = err ? [] : rows;

        // 2. Today's sales
        db.get(`
          SELECT COUNT(*) as count, SUM(grand_total) as total
          FROM sales
          WHERE DATE(sale_date) = DATE('now')
        `, [], (err, row) => {
          snapshot.todaySales = err ? {} : row;

          // 3. This week's revenue
          db.get(`
            SELECT SUM(grand_total) as weekly_revenue, COUNT(*) as weekly_orders
            FROM sales
            WHERE sale_date >= DATE('now', '-7 days')
          `, [], (err, row) => {
            snapshot.weeklyStats = err ? {} : row;

            // 4. Low stock items
            db.all(`
              SELECT name, stock, threshold, category
              FROM products
              WHERE stock <= threshold AND is_raw_material = 0
              ORDER BY stock ASC
              LIMIT 10
            `, [], (err, rows) => {
              snapshot.lowStock = err ? [] : rows;

              // 5. Sales by day of week
              db.all(`
                SELECT strftime('%w', sale_date) as day_of_week,
                       COUNT(*) as order_count,
                       SUM(grand_total) as revenue
                FROM sales
                GROUP BY day_of_week
                ORDER BY day_of_week
              `, [], (err, rows) => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                snapshot.salesByDay = err ? [] : rows.map(r => ({
                  day: days[parseInt(r.day_of_week)],
                  orders: r.order_count,
                  revenue: r.revenue
                }));

                // 6. Pending advanced orders
                db.all(`
                  SELECT customer_name, product_details, pickup_date, status
                  FROM advanced_orders
                  WHERE status = 'Pending'
                  ORDER BY pickup_date ASC
                  LIMIT 5
                `, [], (err, rows) => {
                  snapshot.pendingOrders = err ? [] : rows;

                  // 7. Total products count & total revenue all time
                  db.get(`
                    SELECT COUNT(*) as total_products FROM products WHERE is_raw_material = 0
                  `, [], (err, row) => {
                    snapshot.totalProducts = err ? 0 : row.total_products;

                    db.get(`
                      SELECT SUM(grand_total) as all_time_revenue, COUNT(*) as all_time_orders
                      FROM sales
                    `, [], (err, row) => {
                      snapshot.allTime = err ? {} : row;
                      resolve(snapshot);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Helper: Call Gemini once
async function callGemini(prompt, maxTokens = 512, url = GEMINI_CHAT_URL) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
    })
  });
  const data = await response.json();
  if (!response.ok) throw data.error;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Build business context string (shared)
function buildContext(snapshot) {
  return `
You are an expert AI Business Assistant for a bakery shop. Use INR (₹) for currency.

LIVE BAKERY DATA:
TOP SELLERS: ${snapshot.topSellers.length > 0
  ? snapshot.topSellers.map((p, i) => `${i+1}. ${p.name} — ${p.total_sold} units, ₹${(p.revenue||0).toFixed(2)} revenue`).join('; ')
  : 'No sales data yet'}
TODAY: ${snapshot.todaySales?.count || 0} orders, ₹${(snapshot.todaySales?.total || 0).toFixed(2)}
THIS WEEK: ${snapshot.weeklyStats?.weekly_orders || 0} orders, ₹${(snapshot.weeklyStats?.weekly_revenue || 0).toFixed(2)}
SALES BY DAY: ${snapshot.salesByDay.length > 0
  ? snapshot.salesByDay.map(d => `${d.day}:${d.orders}orders`).join(', ')
  : 'no data'}
LOW STOCK: ${snapshot.lowStock.length > 0
  ? snapshot.lowStock.map(p => `${p.name}(${p.stock} left)`).join(', ')
  : 'all well stocked'}
PENDING ORDERS: ${snapshot.pendingOrders.length > 0
  ? snapshot.pendingOrders.map(o => `${o.customer_name}: ${o.product_details}`).join('; ')
  : 'none'}
ALL-TIME: ${snapshot.allTime?.all_time_orders || 0} orders, ₹${(snapshot.allTime?.all_time_revenue || 0).toFixed(2)}
TOTAL PRODUCTS: ${snapshot.totalProducts}
  `.trim();
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const snapshot = await getBusinessSnapshot();
    const context = buildContext(snapshot);

    const prompt = `${context}

You are a friendly, expert business advisor. Answer the following question based ONLY on the bakery data above. 
Be concise, practical, and use bullet points if helpful. Format numbers nicely with ₹ for currency.
If there is no data for something, say "No data yet — start recording sales to see insights!"

Question: ${message}`;

    const reply = await callGemini(prompt, 600);
    res.json({ reply, snapshot });

  } catch (error) {
    console.error('AI chat error:', error);
    const isQuota = error?.code === 429;
    res.status(500).json({
      error: isQuota
        ? 'Rate limit reached. Please wait 1 minute and try again.'
        : 'Failed to connect to AI service'
    });
  }
});

// GET /api/ai/insights — ONE combined Gemini call for all 4 insights
router.get('/insights', async (req, res) => {
  try {
    const snapshot = await getBusinessSnapshot();
    const context = buildContext(snapshot);

    const prompt = `${context}

Based on the bakery data above, give me exactly 4 business insights. 
Format your response as JSON array like this (no markdown, just raw JSON):
[
  {"title": "📊 Business Health", "text": "2 sentence health summary of today and week"},
  {"title": "🌟 Top Recommendation", "text": "2 sentence recommendation on what to promote or focus on"},
  {"title": "📅 Peak Hours", "text": "1-2 sentences about which day/time is busiest"},
  {"title": "⚠️ Stock Alert", "text": "2 sentences about stock that needs urgent reordering"}
]
Keep each text field to 1-2 sentences maximum. Use ₹ for currency. If no data exists, say so briefly.`;

    const raw = await callGemini(prompt, 600, GEMINI_INSIGHTS_URL);

    // Parse JSON from response
    let insights = [];
    try {
      // Extract JSON array from the response (handle markdown code blocks)
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found');
      }
    } catch (parseErr) {
      // Fallback: split by lines and create manual insights
      console.error('JSON parse failed, using fallback:', parseErr.message);
      insights = [
        { title: '📊 Business Health', text: raw.slice(0, 200) || 'Unable to generate insight.' },
        { title: '🌟 Top Recommendation', text: 'Check your top selling products to prioritize production.' },
        { title: '📅 Peak Hours', text: 'Track daily sales to identify your busiest days.' },
        { title: '⚠️ Stock Alert', text: snapshot.lowStock.length > 0 ? `${snapshot.lowStock[0].name} is low on stock (${snapshot.lowStock[0].stock} left).` : 'All products are well stocked!' },
      ];
    }

    res.json({ insights, snapshot });

  } catch (error) {
    console.error('Insights error:', error);
    const isQuota = error?.code === 429;

    // Even on quota error, return data-driven fallback insights
    try {
      const snapshot = await getBusinessSnapshot();
      const fallback = [
        {
          title: '📊 Business Health',
          text: snapshot.todaySales?.count > 0
            ? `Today you have ${snapshot.todaySales.count} orders totaling ₹${(snapshot.todaySales.total||0).toFixed(2)}. This week: ${snapshot.weeklyStats?.weekly_orders||0} orders.`
            : 'No sales recorded today yet. Start billing customers to see insights!'
        },
        {
          title: '🌟 Top Recommendation',
          text: snapshot.topSellers[0]
            ? `Your best seller is ${snapshot.topSellers[0].name} with ${snapshot.topSellers[0].total_sold} units sold. Keep it well stocked!`
            : 'Record some sales first to see product recommendations.'
        },
        {
          title: '📅 Peak Hours',
          text: snapshot.salesByDay.length > 0
            ? `Your busiest day is ${[...snapshot.salesByDay].sort((a,b) => b.orders-a.orders)[0]?.day || 'unknown'}. Plan extra stock for that day.`
            : 'Make more sales to discover your peak days and hours.'
        },
        {
          title: '⚠️ Stock Alert',
          text: snapshot.lowStock.length > 0
            ? `${snapshot.lowStock.length} item(s) need restocking: ${snapshot.lowStock.slice(0,2).map(p=>p.name).join(', ')}.`
            : '✅ All products are well stocked. Great job!'
        }
      ];
      res.json({ insights: fallback, snapshot, note: isQuota ? 'rate_limited' : 'error' });
    } catch {
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }
});

module.exports = router;
