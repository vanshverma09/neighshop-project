import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  JWT_SECRET: process.env.JWT_SECRET || 'neighshop_classifieds_super_secret_jwt_key_2026_vansh',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || process.env.MYSQL_URL || '',
  DB_CLIENT: process.env.DB_CLIENT || 'auto',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'neighshop_marketplace',
  
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './database/marketplace.sqlite',

  // CORS and Persistent Storage
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || ''
};
