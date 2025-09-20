<?php
/**
 * School Management System Configuration
 * Clean configuration file for production deployment
 */

// Environment detection
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?? 'development');
define('ENVIRONMENT', APP_ENV); // For backward compatibility
define('APP_DEBUG', (APP_ENV === 'development') ? true : ($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?? 'false') === 'true');

// Database configuration
if (APP_ENV === 'production') {
    // Production database (PostgreSQL on Render)
    define('DB_TYPE', 'pgsql');
    define('DB_HOST', $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost');
    define('DB_PORT', $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '5432');
    define('DB_NAME', $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'school_management_db');
    define('DB_USER', $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'school_admin');
    define('DB_PASSWORD', $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?? '');
} else {
    // Development database (SQLite)
    define('DB_TYPE', 'sqlite');
    define('DB_HOST', 'localhost');
    define('DB_PORT', '3306');
    define('DB_NAME', __DIR__ . '/../database/school_management.db');
    define('DB_USER', '');
    define('DB_PASSWORD', '');
}

// Application settings
define('APP_NAME', 'School Management System');
define('APP_VERSION', '1.0.0');
define('APP_TIMEZONE', 'Africa/Dar_es_Salaam');

// Security settings
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?? 'your-secret-key-change-in-production');
define('SESSION_LIFETIME', 8 * 3600); // 8 hours
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
define('SMTP_HOST', $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com');
define('SMTP_PORT', $_ENV['SMTP_PORT'] ?? 587);
define('SMTP_USERNAME', $_ENV['SMTP_USERNAME'] ?? '');
define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD'] ?? '');
define('FROM_EMAIL', $_ENV['FROM_EMAIL'] ?? 'noreply@school.co.tz');
define('FROM_NAME', $_ENV['FROM_NAME'] ?? 'School Management System');

// Logging settings
define('LOG_ENABLED', true);
define('LOG_FILE', __DIR__ . '/../logs/app.log');
define('LOG_LEVEL', $_ENV['LOG_LEVEL'] ?? 'INFO'); // DEBUG, INFO, WARNING, ERROR

// Cache settings
define('CACHE_ENABLED', true);
define('CACHE_TTL', 3600); // 1 hour in seconds

// Rate limiting
define('RATE_LIMIT_ENABLED', true);
define('RATE_LIMIT_REQUESTS', 100);
define('RATE_LIMIT_WINDOW', 15 * 60); // 15 minutes in seconds

// Currency
define('DEFAULT_CURRENCY', 'TZS');
define('CURRENCY_SYMBOL', 'TZS');

// Academic year settings
define('CURRENT_ACADEMIC_YEAR', '2024');
define('CURRENT_TERM', 'Term 1');

// Error handling
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

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
    return APP_ENV === 'development';
}

// Helper function to check if we're in production mode
function isProduction() {
    return APP_ENV === 'production';
}

// CORS headers for API
function setCorsHeaders() {
    $allowedOrigins = $_ENV['CORS_ORIGINS'] ?? '*';
    header("Access-Control-Allow-Origin: " . $allowedOrigins);
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 86400");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>
