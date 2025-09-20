#!/bin/bash

# Render Build Script for School Management System

echo "🚀 Starting build process..."

# Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads logs cache

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 uploads logs cache

# Initialize database if needed
echo "🗄️ Checking database..."
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Production environment detected"
    # Run database initialization if tables don't exist
    php -r "
    require_once 'config/config.php';
    require_once 'config/database.php';
    try {
        \$db = Database::getInstance();
        \$result = \$db->selectOne('SELECT COUNT(*) as count FROM users');
        echo 'Database already initialized with ' . \$result['count'] . ' users\n';
    } catch (Exception \$e) {
        echo 'Initializing database...\n';
        \$sql = file_get_contents('database/init_postgresql.sql');
        \$db->getConnection()->exec(\$sql);
        echo 'Database initialized successfully!\n';
    }
    "
fi

echo "✅ Build completed successfully!"
