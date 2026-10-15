const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database/db');

// Route imports
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const adRoutes = require('./routes/advertisements');
const wishlistRoutes = require('./routes/wishlist');
const enquiryRoutes = require('./routes/enquiries');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'NeighShop Classified Marketplace Shared API',
        candidate: 'Vansh',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/advertisements', adRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start Server
async function startServer() {
    try {
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(` NEIGHSHOP CLASSIFIED MARKETPLACE BACKEND STARTED `);
            console.log(` Server Port:  http://localhost:${PORT}`);
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
