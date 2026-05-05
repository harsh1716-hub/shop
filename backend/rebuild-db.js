/**
 * Rebuild shop.db from scratch with all tables and sample data
 * Run: node rebuild-db.js
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'shop.db');

// Backup old corrupt file
if (fs.existsSync(dbPath)) {
  fs.renameSync(dbPath, dbPath + '.corrupt_backup');
  console.log('Old corrupt DB backed up as shop.db.corrupt_backup');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // ── TABLES ──────────────────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 10,
    barcode TEXT UNIQUE,
    category TEXT DEFAULT 'Uncategorized',
    is_raw_material INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL,
    gst_amount REAL,
    grand_total REAL,
    sale_date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price_at_sale REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    raw_material_id INTEGER,
    quantity_needed REAL,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(raw_material_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    produced_at TEXT DEFAULT (datetime('now')),
    expiry_date TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS advanced_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    contact TEXT,
    item_description TEXT,
    delivery_date TEXT,
    status TEXT DEFAULT 'Pending',
    advance_paid REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // ── DEFAULT ADMIN USER ───────────────────────────────────────────────────
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);

  // ── PRODUCTS ─────────────────────────────────────────────────────────────
  const products = [
    // Cakes & Pastries
    ['Plum Cake',           300, 10, 5,  'CAKE001', 'Cakes & Pastries',       0],
    ['Marble Tea Cake',     200, 15, 5,  'CAKE002', 'Cakes & Pastries',       0],
    ['Black Forest Cake',   450, 8,  3,  'CAKE003', 'Cakes & Pastries',       0],
    ['Pineapple Pastry',    60,  20, 10, 'CAKE004', 'Cakes & Pastries',       0],
    // Cookies & Biscuits
    ['Coconut Cookies',     80,  40, 10, 'COOK001', 'Cookies & Biscuits',     0],
    ['Butter Cookies',      90,  35, 10, 'COOK002', 'Cookies & Biscuits',     0],
    ['Cashew Chikki',       150, 25, 8,  'COOK003', 'Cookies & Biscuits',     0],
    ['Almond Cookies',      120, 30, 10, 'COOK004', 'Cookies & Biscuits',     0],
    // Savory Puffs & Snacks
    ['Veg Puff',            25,  50, 20, 'PUFF001', 'Savory Puffs & Snacks',  0],
    ['Cheese Puff',         35,  40, 15, 'PUFF002', 'Savory Puffs & Snacks',  0],
    ['Samosa',              20,  60, 20, 'PUFF003', 'Savory Puffs & Snacks',  0],
    // Breads & Buns
    ['Plain Khari',         60,  30, 10, 'BREA001', 'Breads & Buns',          0],
    ['Dinner Roll',         15,  60, 20, 'BREA002', 'Breads & Buns',          0],
    ['Bread Loaf',          45,  20, 8,  'BREA003', 'Breads & Buns',          0],
    // Chocolates & Sweets
    ['Chocolate Truffle',   80,  25, 10, 'CHOC001', 'Chocolates & Sweets',    0],
    ['Chocolate Eclair',    50,  30, 10, 'CHOC002', 'Chocolates & Sweets',    0],
    // Raw Materials
    ['Maida (Flour)',       50,  100,20, 'RAW001',  'Raw Materials',           1],
    ['Sugar',               45,  80, 20, 'RAW002',  'Raw Materials',           1],
    ['Butter',              55,  60, 15, 'RAW003',  'Raw Materials',           1],
    ['Cocoa Powder',        200, 30, 10, 'RAW004',  'Raw Materials',           1],
  ];

  const pStmt = db.prepare(`INSERT INTO products (name, price, stock, threshold, barcode, category, is_raw_material) VALUES (?,?,?,?,?,?,?)`);
  products.forEach(p => pStmt.run(p));
  pStmt.finalize();

  // ── SAMPLE SALES (30 days) ───────────────────────────────────────────────
  const salesData = [
    [null, 320,  38.4,  358.4, '2026-04-05 09:30:00'],
    [null, 450,  54,    504,   '2026-04-08 11:00:00'],
    [null, 680,  81.6,  761.6, '2026-04-09 14:00:00'],
    [null, 290,  34.8,  324.8, '2026-04-10 10:30:00'],
    [null, 750,  90,    840,   '2026-04-14 15:00:00'],
    [null, 420,  50.4,  470.4, '2026-04-16 12:00:00'],
    [null, 890,  106.8, 996.8, '2026-04-18 16:00:00'],
    [null, 500,  60,    560,   '2026-04-21 10:00:00'],
    [null, 340,  40.8,  380.8, '2026-04-23 13:00:00'],
    [null, 720,  86.4,  806.4, '2026-04-25 11:30:00'],
    [null, 560,  67.2,  627.2, '2026-04-28 09:00:00'],
    [null, 430,  51.6,  481.6, '2026-04-30 14:30:00'],
    [null, 800,  96,    896,   '2026-05-01 10:00:00'],
    [null, 650,  78,    728,   '2026-05-02 15:30:00'],
    [null, 920,  110.4, 1030.4,'2026-05-03 11:00:00'],
  ];

  const sStmt = db.prepare(`INSERT INTO sales (customer_id, total_amount, gst_amount, grand_total, sale_date) VALUES (?,?,?,?,?)`);
  salesData.forEach(s => sStmt.run(s));
  sStmt.finalize();

  // Sale items (referencing product IDs 1-16)
  const siData = [
    [1,5,2,80], [1,1,1,300],
    [2,6,3,90],  [2,15,2,80],
    [3,1,2,300], [3,12,2,60],
    [4,5,4,80],  [4,9,2,25],
    [5,2,2,200], [5,7,1,150],
    [6,1,2,300], [6,6,2,90],
    [7,15,3,80], [7,5,5,80],
    [8,5,2,80],  [8,1,1,300],
    [9,9,4,25],  [9,10,2,35],
    [10,2,2,200],[10,1,1,300],
    [11,1,1,300],[11,5,3,80],
    [12,6,2,90], [12,15,2,80],
    [13,2,2,200],[13,7,2,150],
    [14,1,1,300],[14,9,6,25],
    [15,5,4,80], [15,1,2,300],
  ];

  const siStmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?,?,?,?)`);
  siData.forEach(si => siStmt.run(si));
  siStmt.finalize();

  // ── SAMPLE ADVANCED ORDERS ───────────────────────────────────────────────
  db.run(`INSERT INTO advanced_orders (customer_name, contact, item_description, delivery_date, status, advance_paid, total_amount)
    VALUES ('Sneha', '9876543210', 'Bun Cakes', '2026-04-04T10:00', 'Completed', 200, 500)`);
  db.run(`INSERT INTO advanced_orders (customer_name, contact, item_description, delivery_date, status, advance_paid, total_amount)
    VALUES ('Rahul', '9812345678', 'Cookies', '2026-05-10T12:00', 'Pending', 100, 300)`);

  console.log('✅ Database rebuilt successfully!');
  console.log('   Tables: users, customers, products, sales, sale_items, recipes, batches, advanced_orders');
  console.log(`   Products: ${products.length} inserted`);
  console.log(`   Sales: ${salesData.length} inserted`);
});

db.close(() => console.log('Done. Restart backend: node server.js'));
