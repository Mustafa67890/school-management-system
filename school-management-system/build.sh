#!/bin/bash
# Build script for Render deployment

echo "Starting build process for School Management System..."

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p cache

# Set permissions
echo "Setting permissions..."
chmod 755 logs
chmod 755 uploads
chmod 755 cache

# Install PHP dependencies if composer.json exists
if [ -f "composer.json" ]; then
    echo "Installing PHP dependencies..."
    composer install --no-dev --optimize-autoloader
else
    echo "No composer.json found, skipping PHP dependencies"
fi

# Copy production config if it exists
if [ -f "backend/config/config-clean.php" ]; then
    echo "Using clean production config..."
    cp backend/config/config-clean.php backend/config/config.php
fi

# Initialize database if in production
if [ "$APP_ENV" = "production" ]; then
    echo "Setting up production database..."
    # Database initialization will be handled by the application
fi

echo "Build completed successfully!"
