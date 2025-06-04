-- Create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'products_db')
BEGIN
    CREATE DATABASE products_db;
END
GO

USE products_db;
GO

-- Create Categories table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        categoryID INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create a unified Products table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        productID INT PRIMARY KEY IDENTITY(1,1),
        categoryID INT FOREIGN KEY REFERENCES Categories(categoryID),
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(1000) NULL,
        price DECIMAL(10, 2) NOT NULL,
        stockQuantity INT NOT NULL DEFAULT 0,
        brand NVARCHAR(100) NULL,
        imageURL NVARCHAR(500) NULL,
        featured BIT DEFAULT 0,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create ProductAttributes table for storing specific product attributes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductAttributes')
BEGIN
    CREATE TABLE ProductAttributes (
        attributeID INT PRIMARY KEY IDENTITY(1,1),
        productID INT FOREIGN KEY REFERENCES Products(productID) ON DELETE CASCADE,
        attributeName NVARCHAR(100) NOT NULL,
        attributeValue NVARCHAR(MAX) NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Insert sample categories if the table is empty
IF NOT EXISTS (SELECT TOP 1 1 FROM Categories)
BEGIN
    INSERT INTO Categories (name, description)
    VALUES 
    ('Electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'Apparel and fashion items'),
    ('Furniture', 'Home and office furniture'),
    ('Groceries', 'Food and household items');
END
GO

-- Sample data for Products and their attributes
-- Electronics
IF NOT EXISTS (SELECT TOP 1 1 FROM Products WHERE categoryID = 1)
BEGIN
    -- Insert Smartphone X
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (1, 'Smartphone X', 'Latest smartphone with advanced features', 999.99, 50, 'TechBrand', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c21hcnRwaG9uZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @smartphone_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@smartphone_id, 'model', 'X-2023'),
    (@smartphone_id, 'warranty', '1 Year'),
    (@smartphone_id, 'specifications', '6.5" display, 128GB storage, 8GB RAM');
    
    -- Insert Laptop Pro
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (1, 'Laptop Pro', 'High-performance laptop for professionals', 1499.99, 25, 'CompuTech', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFwdG9wfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @laptop_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@laptop_id, 'model', 'Pro-15'),
    (@laptop_id, 'warranty', '2 Years'),
    (@laptop_id, 'specifications', '15.6" display, 512GB SSD, 16GB RAM, Intel i7');
    
    -- Insert Wireless Earbuds
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (1, 'Wireless Earbuds', 'True wireless earbuds with noise cancellation', 149.99, 100, 'AudioMax', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGVhcmJ1ZHN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60', 0);
    
    DECLARE @earbuds_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@earbuds_id, 'model', 'AM-TWS200'),
    (@earbuds_id, 'warranty', '6 Months'),
    (@earbuds_id, 'specifications', 'Bluetooth 5.2, 8 hours battery life');
END
GO

-- Clothing
IF NOT EXISTS (SELECT TOP 1 1 FROM Products WHERE categoryID = 2)
BEGIN
    -- Insert Cotton T-Shirt
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (2, 'Cotton T-Shirt', 'Comfortable everyday t-shirt', 19.99, 200, 'FashionBasics', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHNoaXJ0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @tshirt_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@tshirt_id, 'size', 'M'),
    (@tshirt_id, 'color', 'Black'),
    (@tshirt_id, 'material', '100% Cotton'),
    (@tshirt_id, 'gender', 'Unisex');
    
    -- Insert Denim Jeans
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (2, 'Denim Jeans', 'Classic fit denim jeans', 49.99, 150, 'DenimCo', 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amVhbnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @jeans_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@jeans_id, 'size', '32'),
    (@jeans_id, 'color', 'Blue'),
    (@jeans_id, 'material', 'Denim'),
    (@jeans_id, 'gender', 'Men');
    
    -- Insert Summer Dress
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (2, 'Summer Dress', 'Light summer dress with floral pattern', 39.99, 75, 'ChicStyles', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZHJlc3N8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60', 0);
    
    DECLARE @dress_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@dress_id, 'size', 'S'),
    (@dress_id, 'color', 'Floral'),
    (@dress_id, 'material', 'Polyester'),
    (@dress_id, 'gender', 'Women');
END
GO

-- Furniture
IF NOT EXISTS (SELECT TOP 1 1 FROM Products WHERE categoryID = 3)
BEGIN
    -- Insert Office Chair
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (3, 'Office Chair', 'Ergonomic office chair with lumbar support', 199.99, 30, 'ComfortPlus', 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8b2ZmaWNlJTIwY2hhaXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @chair_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@chair_id, 'material', 'Leather, Metal'),
    (@chair_id, 'dimensions', '60x70x110cm'),
    (@chair_id, 'weight', '15.5'),
    (@chair_id, 'style', 'Modern');
    
    -- Insert Wooden Dining Table
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (3, 'Wooden Dining Table', 'Solid wood dining table for 6 people', 399.99, 15, 'WoodWorks', 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZGluaW5nJTIwdGFibGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @table_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@table_id, 'material', 'Oak Wood'),
    (@table_id, 'dimensions', '180x90x75cm'),
    (@table_id, 'weight', '45.0'),
    (@table_id, 'style', 'Rustic');
    
    -- Insert Bookshelf
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (3, 'Bookshelf', 'Modern 5-tier bookshelf', 149.99, 40, 'HomeDesign', 'https://images.unsplash.com/photo-1589891685608-58e3be8e6de4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Ym9va3NoZWxmfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60', 0);
    
    DECLARE @bookshelf_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@bookshelf_id, 'material', 'MDF, Steel'),
    (@bookshelf_id, 'dimensions', '80x30x180cm'),
    (@bookshelf_id, 'weight', '25.0'),
    (@bookshelf_id, 'style', 'Contemporary');
END
GO

-- Groceries
IF NOT EXISTS (SELECT TOP 1 1 FROM Products WHERE categoryID = 4)
BEGIN
    -- Insert Organic Milk
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (4, 'Organic Milk', 'Fresh organic whole milk', 3.99, 100, 'FarmFresh', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8bWlsa3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @milk_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@milk_id, 'weight', '1.0'),
    (@milk_id, 'expiryDate', '2023-12-30'),
    (@milk_id, 'nutritionalInfo', 'Calories: 150, Fat: 8g, Protein: 8g'),
    (@milk_id, 'storageRequirements', 'Refrigerated');
    
    -- Insert Whole Grain Bread
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (4, 'Whole Grain Bread', 'Nutritious whole grain bread', 4.99, 50, 'BakeryDelight', 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGJyZWFkfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60', 1);
    
    DECLARE @bread_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@bread_id, 'weight', '0.5'),
    (@bread_id, 'expiryDate', '2023-12-15'),
    (@bread_id, 'nutritionalInfo', 'Calories: 80 per slice, Fiber: 3g'),
    (@bread_id, 'storageRequirements', 'Room temperature');
    
    -- Insert Organic Apples
    INSERT INTO Products (categoryID, name, description, price, stockQuantity, brand, imageURL, featured)
    VALUES (4, 'Organic Apples', 'Fresh organic apples', 2.99, 200, 'OrganicFarms', 'https://images.unsplash.com/photo-1569870499705-504209102861?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXBwbGVzfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60', 0);
    
    DECLARE @apples_id INT = SCOPE_IDENTITY();
    
    INSERT INTO ProductAttributes (productID, attributeName, attributeValue)
    VALUES 
    (@apples_id, 'weight', '1.0'),
    (@apples_id, 'expiryDate', '2023-12-20'),
    (@apples_id, 'nutritionalInfo', 'Rich in fiber and antioxidants'),
    (@apples_id, 'storageRequirements', 'Room temperature or refrigerated');
END
GO 