import express from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env';
import { initDatabase, getDbType } from './database/db';

// Route imports
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import adRoutes from './routes/ad.routes';
import wishlistRoutes from './routes/wishlist.routes';
import enquiryRoutes from './routes/enquiry.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';

import { notFoundHandler, errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = ENV.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost, 127.0.0.1, Vercel deployments (*.vercel.app), and custom domains
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'NeighShop Classified Marketplace Shared API',
    candidate: 'Vansh',
    database: getDbType().toUpperCase(),
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/advertisements', adRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/favourites', wishlistRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// 404 & Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
async function startServer(): Promise<void> {
  try {
    const { dbType } = await initDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` NEIGHSHOP CLASSIFIED MARKETPLACE BACKEND STARTED `);
      console.log(` Server Port:  http://localhost:${PORT}`);
      console.log(` Database:     ${dbType.toUpperCase()}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(` Ads API:      http://localhost:${PORT}/api/advertisements`);
      console.log(` Admin API:    http://localhost:${PORT}/api/admin/stats`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Initialization Error:', err);
    process.exit(1);
  }
}

startServer();

export default app;
