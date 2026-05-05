const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./shop.db', (err) => {
  if (err) { console.log('OPEN ERROR:', err.message); return; }
  console.log('Database opened OK');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) { console.log('TABLES ERROR:', err.message); }
    else { console.log('Tables:', rows.map(r => r.name).join(', ')); }
    
    // Try to read products
    db.all("SELECT id, name, category, is_raw_material FROM products LIMIT 5", [], (err2, rows2) => {
      if (err2) { console.log('PRODUCTS ERROR:', err2.message); }
      else { console.log('Sample products:', JSON.stringify(rows2, null, 2)); }
      db.close();
    });
  });
});
