// Kết nối tới cơ sở dữ liệu MSSQL

const sql = require('mssql');
require('dotenv').config({ path: __dirname + '/.env' }); // Đọc biến môi trường từ file .env

// Cấu hình kết nối database
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Mã hóa kết nối nếu cần
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // Tin cậy chứng chỉ tự ký
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Tạo pool kết nối
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Xử lý lỗi kết nối
poolConnect.catch(err => {
  console.error('Lỗi kết nối database:', err);
});

let isConnected = false;

// Hàm kết nối tới database, trả về pool nếu thành công
const connectDB = async () => {
  try {
    await poolConnect;
    if (!isConnected) {
      console.log('Kết nối MSSQL thành công');
      isConnected = true;
    }
    return pool;
  } catch (error) {
    console.error('Kết nối database thất bại:', error);
    throw error;
  }
};

module.exports = { connectDB, pool };