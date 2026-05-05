const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // PRODUCTS (Both Raw Materials and Baked Goods)
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    threshold INTEGER DEFAULT 10,
    barcode TEXT UNIQUE,
    category TEXT DEFAULT 'Uncategorized',
    is_raw_material BOOLEAN DEFAULT 0
  )`);

  // CUSTOMERS
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT
  )`);

  // SALES
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL NOT NULL,
    gst_amount REAL NOT NULL,
    grand_total REAL NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  )`);

  // SALE ITEMS
  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price_at_sale REAL NOT NULL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  // NEW: BATCHES (For tracking expiry dates of baked goods)
  db.run(`CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    baked_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME NOT NULL,
    original_quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  // NEW: RECIPES (Links to a baked product)
  db.run(`CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    final_product_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY(final_product_id) REFERENCES products(id)
  )`);

  // NEW: RECIPE INGREDIENTS (Links raw materials to a recipe)
  db.run(`CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_product_id INTEGER NOT NULL,
    quantity_needed INTEGER NOT NULL,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id),
    FOREIGN KEY(ingredient_product_id) REFERENCES products(id)
  )`);

  // NEW: ADVANCED ORDERS
  db.run(`CREATE TABLE IF NOT EXISTS advanced_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    product_details TEXT NOT NULL,
    pickup_date DATETIME NOT NULL,
    status TEXT DEFAULT 'Pending'
  )`);

  // Seed Bakery Data
  db.get("SELECT COUNT(*) as count FROM products", [], (err, row) => {
    if (!err && row.count === 0) {
      db.run(`INSERT INTO products (name, price, stock, threshold, barcode, category, is_raw_material) VALUES 
        ('Flour 1kg', 60, 50, 10, 'RAW001', 'Raw Materials', 1),
        ('Sugar 1kg', 45, 50, 10, 'RAW002', 'Raw Materials', 1),
        ('Butter 500g', 250, 20, 5, 'RAW003', 'Raw Materials', 1),
        ('Yeast 100g', 40, 20, 5, 'RAW004', 'Raw Materials', 1),
        
        ('Coconut Cookies', 80, 40, 10, 'BAKED005', 'Cookies & Biscuits', 0),
        ('Butter Cookies', 90, 35, 10, 'BAKED006', 'Cookies & Biscuits', 0),
        ('Cashew Chikki', 150, 25, 10, 'BAKED007', 'Cookies & Biscuits', 0),
        ('Nankhatai', 120, 30, 10, 'BAKED008', 'Cookies & Biscuits', 0),
        ('Sweet Rusk', 70, 40, 15, 'BAKED032', 'Cookies & Biscuits', 0),
        ('Milk Rusk', 75, 40, 15, 'BAKED033', 'Cookies & Biscuits', 0),
        
        ('Marble Tea Cake', 200, 15, 5, 'BAKED009', 'Cakes & Pastries', 0),
        ('Fruit Tea Cake', 220, 12, 5, 'BAKED010', 'Cakes & Pastries', 0),
        ('Plum Cake', 300, 10, 5, 'BAKED011', 'Cakes & Pastries', 0),
        ('Vanilla Cupcakes (Box of 4)', 150, 20, 5, 'BAKED012', 'Cakes & Pastries', 0),
        ('Chocolate Truffle Pastry', 80, 25, 10, 'BAKED013', 'Cakes & Pastries', 0),
        ('Pineapple Pastry', 70, 20, 10, 'BAKED014', 'Cakes & Pastries', 0),
        ('Black Forest Pastry', 85, 18, 5, 'BAKED028', 'Cakes & Pastries', 0),
        
        ('Plain Khari', 60, 50, 10, 'BAKED015', 'Savory Puffs & Snacks', 0),
        ('Jeera Khari', 65, 45, 10, 'BAKED016', 'Savory Puffs & Snacks', 0),
        ('Masala Khari', 70, 40, 10, 'BAKED017', 'Savory Puffs & Snacks', 0),
        ('Cheese Khari', 85, 30, 10, 'BAKED018', 'Savory Puffs & Snacks', 0),
        ('Veg Puff Patties', 20, 50, 20, 'BAKED019', 'Savory Puffs & Snacks', 0),
        ('French Hearts', 100, 25, 10, 'BAKED020', 'Savory Puffs & Snacks', 0),
        ('Methipara', 90, 30, 10, 'BAKED025', 'Savory Puffs & Snacks', 0),
        ('Namak Para', 80, 35, 10, 'BAKED026', 'Savory Puffs & Snacks', 0),
        ('Savory Biscuits', 75, 40, 10, 'BAKED027', 'Savory Puffs & Snacks', 0),
        
        ('Pav (Buns - 6pc)', 40, 50, 20, 'BAKED021', 'Breads & Buns', 0),
        ('White Bread (Sliced)', 50, 40, 10, 'BAKED030', 'Breads & Buns', 0),
        ('Brown Bread (Sliced)', 60, 30, 10, 'BAKED031', 'Breads & Buns', 0),
        ('Garlic Toast', 60, 35, 15, 'BAKED022', 'Breads & Buns', 0),
        ('Milk Toast', 55, 30, 10, 'BAKED034', 'Breads & Buns', 0),
        ('Bread Sticks', 60, 40, 15, 'BAKED023', 'Breads & Buns', 0),
        ('Sweet Bun', 15, 60, 20, 'BAKED035', 'Breads & Buns', 0),
        
        ('Dark Chocolate chocobar', 150, 30, 5, 'BAKED036', 'Chocolates & Sweets', 0),
        ('Milk Chocolate Bar', 120, 40, 5, 'BAKED037', 'Chocolates & Sweets', 0),
        ('Chocolate Truffle Balls (6pc)', 200, 15, 5, 'BAKED038', 'Chocolates & Sweets', 0),
        ('Assorted Chocolates Box', 350, 10, 3, 'BAKED039', 'Chocolates & Sweets', 0)
      `);
      console.log('Seeded database with Categorized Indian Bakery setup!');
    }
  });
});

module.exports = db;
