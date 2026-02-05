const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Use MySQL Database (Docker Container)
const { connectDB } = require('./config/database-mysql');
const errorHandler = require('./middleware/errorHandler');

// Import routes (same routes work for MySQL!)
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const roomBookingRoutes = require('./routes/room-bookings');
const contactRoutes = require('./routes/contacts');
const roomRoutes = require('./routes/rooms');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');
const payfastRoutes = require('./routes/payfast');
const expenditureRoutes = require('./routes/expenditures');
const settingRoutes = require('./routes/settings');

const app = express();

// Trust proxy - Required for Railway and other proxy services
app.set('trust proxy', true);

// Connect to MySQL Database
connectDB();

// CORS configuration - MUST BE BEFORE OTHER MIDDLEWARE
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Use environment variable or allow all
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Security middleware with relaxed CSP for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5174", "http://localhost:5173", "https://via.placeholder.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  validate: { trustProxy: false } // Disable trust proxy validation for development
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files - serve with CORS headers
app.use('/uploads', express.static('src/uploads', {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings/rooms', roomBookingRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payfast', payfastRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/settings', settingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Phokela Guest House API Server',
    version: '1.0.0',
    status: 'Running',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000; // Default port

const server = app.listen(PORT, () => {
  console.log(`🚀 Phokela Guest House API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;