require('dotenv').config();

const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Safe Global Express Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
  .catch((err) => {
    console.warn('Atlas connection failed, using local MongoDB:', err.message);
    return mongoose.connect('mongodb://127.0.0.1:27017/shopkart');
  })
  .then(() => {
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });