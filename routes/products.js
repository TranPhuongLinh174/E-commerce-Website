const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectDB } = require('../config/db');

// Helper: set params for request (not used much, but kept for reference)
function setRequestParams(request, category, search, sql) {
  if (category) request.input('categoryID', sql.Int, parseInt(category));
  if (search) request.input('search', sql.NVarChar, `%${search}%`);
}

// --- API: Get paginated products (with optional category & search) ---
router.get('/products', async (req, res) => {
  try {
    const pool = await connectDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    let whereClause = 'WHERE 1=1';
    if (category) whereClause += ' AND p.categoryID = @categoryID';
    if (search) whereClause += ' AND (p.name LIKE @search OR p.description LIKE @search OR p.brand LIKE @search)';

    const queryProducts = `
      SELECT p.*, c.name as categoryName
      FROM Products p
      JOIN Categories c ON p.categoryID = c.categoryID
      ${whereClause}
      ORDER BY p.createdAt DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `;

    const queryCount = `
      SELECT COUNT(*) as total
      FROM Products p
      JOIN Categories c ON p.categoryID = c.categoryID
      ${whereClause}
    `;

    // Set params for both queries
    const productsRequest = pool.request();
    if (category && !isNaN(Number(category))) {
      productsRequest.input('categoryID', sql.Int, parseInt(category));
    }
    if (search) productsRequest.input('search', sql.NVarChar, `%${search}%`);
    const products = await productsRequest.query(queryProducts);

    const countRequest = pool.request();
    if (category && !isNaN(Number(category))) {
      countRequest.input('categoryID', sql.Int, parseInt(category));
    }
    if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
    const countResult = await countRequest.query(queryCount);

    const totalItems = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      products: products.recordset,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy tất cả sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu sản phẩm' });
  }
});

// --- API: Get featured products ---
router.get('/products/featured', async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .query(`
        SELECT TOP 8 p.*, c.name AS categoryName
        FROM Products p
        JOIN Categories c ON p.categoryID = c.categoryID
        WHERE p.featured = 1
        ORDER BY p.createdAt DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm nổi bật:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// --- API: Get products by category ---
router.get('/products/category/:id', async (req, res) => {
  const categoryId = req.params.id;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('categoryId', sql.Int, categoryId)
      .query(`
        SELECT p.*, c.name as categoryName 
        FROM Products p
        JOIN Categories c ON p.categoryID = c.categoryID
        WHERE p.categoryID = @categoryId
        ORDER BY p.createdAt DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo danh mục:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu sản phẩm theo danh mục' });
  }
});

// --- API: Get product detail ---
router.get('/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  try {
    const pool = await connectDB();

    const productResult = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT p.*, c.name as categoryName 
        FROM Products p
        JOIN Categories c ON p.categoryID = c.categoryID
        WHERE p.productID = @productId
      `);

    if (productResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    // Optional: get attributes if you use them
    const attributesResult = await pool.request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT attributeName, attributeValue 
        FROM ProductAttributes
        WHERE productID = @productId
      `);

    const product = productResult.recordset[0];
    product.attributes = attributesResult.recordset;

    res.json(product);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết sản phẩm', detail: error.message });
  }
});

// --- API: Get all categories ---
router.get('/categories', async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM Categories');
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi lấy tất cả danh mục:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// --- API: Search products ---
router.get('/search', async (req, res) => {
  const keyword = req.query.q || '';
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('keyword', sql.NVarChar, `%${keyword}%`)
      .query(`
        SELECT p.*, c.name as categoryName 
        FROM Products p
        JOIN Categories c ON p.categoryID = c.categoryID
        WHERE p.name LIKE @keyword 
           OR p.description LIKE @keyword 
           OR p.brand LIKE @keyword
        ORDER BY p.createdAt DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm sản phẩm' });
  }
});

// --- API: Add product ---
router.post('/products', async (req, res) => {
  try {
    const { name, price, categoryID, description, imageURL, featured, stockQuantity, brand } = req.body;
    const pool = await connectDB();
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(18,2), price)
      .input('categoryID', sql.Int, categoryID)
      .input('description', sql.NVarChar, description)
      .input('stockQuantity', sql.Int, stockQuantity)
      .input('imageURL', sql.NVarChar, imageURL || '')
      .input('featured', sql.Bit, featured ? 1 : 0)
      .input('brand', sql.NVarChar, brand || 'No Brand')
      .query(`
        INSERT INTO Products (name, price, categoryID, description, stockQuantity, imageURL, featured, brand, createdAt, updatedAt)
        VALUES (@name, @price, @categoryID, @description, @stockQuantity, @imageURL, @featured, @brand, GETDATE(), GETDATE())
      `);
    res.json({ message: 'Product added successfully' });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error adding product', detail: error.message });
  }
});

// --- API: Update product ---
router.put('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, categoryID, description, stockQuantity, brand, imageURL, featured } = req.body;
    const pool = await connectDB();
    await pool.request()
      .input('productId', sql.Int, productId)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(18,2), price)
      .input('categoryID', sql.Int, categoryID)
      .input('description', sql.NVarChar, description)
      .input('stockQuantity', sql.Int, stockQuantity)
      .input('imageURL', sql.NVarChar, imageURL || '')
      .input('featured', sql.Bit, featured ? 1 : 0)
      .input('brand', sql.NVarChar, brand || 'No Brand')
      .query(`
        UPDATE Products SET
          name = @name,
          price = @price,
          categoryID = @categoryID,
          description = @description,
          stockQuantity = @stockQuantity,
          imageURL = @imageURL,
          featured = @featured,
          brand = @brand,
          updatedAt = GETDATE()
        WHERE productID = @productId
      `);
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// --- API: Delete product ---
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const pool = await connectDB();
    await pool.request()
      .input('productId', sql.Int, productId)
      .query('DELETE FROM Products WHERE productID = @productId');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

module.exports = router;
