require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const bakeryRouter = require('./routes/bakery');
const ordersRouter = require('./routes/orders');
const authRouter = require('./routes/auth');
const aiRouter = require('./routes/ai');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/bakery', bakeryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Platform is up and running!' });
});

app.listen(PORT, () => {
  console.log(`SmartShop Backend is running on http://localhost:${PORT}`);
});
