const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');
const staffRoutes = require('./routes/staff');
const payrollRoutes = require('./routes/payroll');
const procurementRoutes = require('./routes/procurement');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'School Management System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            fees: '/api/fees',
            staff: '/api/staff',
            payroll: '/api/payroll',
            procurement: '/api/procurement',
            inventory: '/api/inventory',
            reports: '/api/reports',
            settings: '/api/settings',
            health: '/api/health'
        },
        documentation: 'https://github.com/school-management/api-docs'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.originalUrl} was not found on this server.`,
        availableEndpoints: [
            '/api/auth',
            '/api/students',
            '/api/fees',
            '/api/staff',
            '/api/payroll',
            '/api/procurement',
            '/api/inventory',
            '/api/reports',
            '/api/settings'
        ]
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Database connection errors
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            error: 'Database connection failed',
            message: 'Unable to connect to the database. Please try again later.'
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'The provided authentication token is invalid.'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            message: 'The authentication token has expired. Please login again.'
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            message: err.message,
            details: err.details
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong on our end.'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🚀 School Management System API Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.DB_NAME || 'school_management'}
🔗 API Base URL: http://localhost:${PORT}/api
📖 API Documentation: http://localhost:${PORT}/api
💚 Health Check: http://localhost:${PORT}/api/health
    `);
});

module.exports = app;