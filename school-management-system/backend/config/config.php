<?php
/**
 * School Management System Configuration
 * Main configuration file for the application
 */

// Environment settings
define('ENVIRONMENT', 'development'); // development, production, testing

// Application settings
define('APP_NAME', 'School Management System');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost');
define('API_BASE_URL', 'http://localhost/backend');

// Database configuration - Use environment variables for production
define('DB_TYPE', 'pgsql'); // sqlite, mysql, pgsql
define('DB_HOST', getenv('DATABASE_HOST') ?: 'localhost');
define('DB_PORT', getenv('DATABASE_PORT') ?: '5432');
define('DB_NAME', getenv('DATABASE_NAME') ?: 'school_management_db');
define('DB_USER', getenv('DATABASE_USER') ?: 'school_admin');
define('DB_PASSWORD', getenv('DATABASE_PASSWORD') ?: '1234Mustaf@');
define('DB_CHARSET', 'utf8');

// JWT Configuration
define('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production');
define('JWT_EXPIRES_IN', 8 * 60 * 60); // 8 hours in seconds
define('JWT_REFRESH_EXPIRES_IN', 7 * 24 * 60 * 60); // 7 days in seconds

// Security settings
define('BCRYPT_COST', 12);
define('SESSION_TIMEOUT', 8 * 60 * 60); // 8 hours in seconds
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 15 * 60); // 15 minutes in seconds

// File upload settings
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB in bytes
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx']);

// Pagination settings
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// School information
define('SCHOOL_NAME', 'Mwalimu Secondary School');
define('SCHOOL_ADDRESS', 'P.O. Box 123, Dar es Salaam, Tanzania');
define('SCHOOL_PHONE', '+255 754 123 456');
define('SCHOOL_EMAIL', 'info@mwalimu.co.tz');

// Email configuration (optional)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('FROM_EMAIL', 'noreply@school.co.tz');
define('FROM_NAME', 'School Management System');

// Logging settings
define('LOG_ENABLED', true);
define('LOG_FILE', __DIR__ . '/../logs/app.log');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR

// Cache settings
define('CACHE_ENABLED', true);
define('CACHE_TTL', 3600); // 1 hour in seconds

// Rate limiting
define('RATE_LIMIT_ENABLED', true);
define('RATE_LIMIT_REQUESTS', 100);
define('RATE_LIMIT_WINDOW', 15 * 60); // 15 minutes in seconds

// Timezone
define('DEFAULT_TIMEZONE', 'Africa/Dar_es_Salaam');

// Currency
define('DEFAULT_CURRENCY', 'TZS');
define('CURRENCY_SYMBOL', 'TZS');

// Academic year settings
define('CURRENT_ACADEMIC_YEAR', '2024');
define('CURRENT_TERM', 'Term 1');

// Error handling
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Set timezone
date_default_timezone_set(DEFAULT_TIMEZONE);

// Create necessary directories
$directories = [
    __DIR__ . '/../uploads',
    __DIR__ . '/../logs',
    __DIR__ . '/../cache'
];

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Helper function to get configuration value
function getConfig($key, $default = null) {
    return defined($key) ? constant($key) : $default;
}

// Helper function to check if we're in development mode
function isDevelopment() {
    return ENVIRONMENT === 'development';
}

// Helper function to check if we're in production mode
function isProduction() {
    return ENVIRONMENT === 'production';
}
?>
