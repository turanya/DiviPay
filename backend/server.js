require('dotenv').config();

// Add debugging for environment variables
console.log('🔍 Environment Variables Debug:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');

const app = express();

// Connect to database with error handling
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit process immediately, let Railway handle restarts
    setTimeout(() => process.exit(1), 5000);
  }
};

initializeDatabase();

// CORS configuration - Updated with your Vercel URL
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://divipay-sage.vercel.app', // Your Vercel URL
  'https://divipay.vercel.app' // Alternative Vercel URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('origin') || 'none'}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

// Enhanced health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 DiviPay Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    cors: allowedOrigins,
    database: process.env.MONGODB_URI ? 'Connected' : 'Missing URI',
    port: process.env.PORT || 5000
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to DiviPay API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups', 
      expenses: '/api/expenses',
      health: '/api/health'
    },
    documentation: 'https://github.com/turanya/DiviPay'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error - origin not allowed',
      allowedOrigins
    });
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/api/auth',
      '/api/groups',
      '/api/expenses',
      '/api/health'
    ]
  });
});

// Use Railway's PORT or fallback to 5000
const PORT = process.env.PORT || 5000;

// Listen on all interfaces for Railway deployment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 DiviPay Backend Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started at: ${new Date().toISOString()}
🔗 Health Check: http://localhost:${PORT}/api/health
🌐 CORS Origins: ${allowedOrigins.join(', ')}
💾 Database: ${process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing'}
🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}
  `);
});

// Enhanced process error handlers
process.on('unhandledRejection', (err, promise) => {
  console.error('🚫 Unhandled Promise Rejection:');
  console.error('Promise:', promise);
  console.error('Reason:', err);
  
  // Don't exit immediately in production, let Railway handle restarts
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 5000);
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('🚫 Uncaught Exception:', err);
  
  // Don't exit immediately in production, let Railway handle restarts  
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 5000);
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
