// server.js - Điểm khởi động chính của ứng dụng

require('dotenv').config({ path: './config/.env' });
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parse JSON và form
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Phục vụ file tĩnh 
app.use(express.static(path.join(__dirname, 'views')));

// API sản phẩm (RESTful)
app.use('/api', productsRouter);

// Trang chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Trang chi tiết sản phẩm
app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'product-detail.html'));
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});