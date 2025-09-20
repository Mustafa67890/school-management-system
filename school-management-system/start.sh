#!/bin/bash
# Start script for Render deployment

echo "Starting School Management System..."

# Set environment variables
export APP_ENV=${APP_ENV:-production}
export PORT=${PORT:-10000}

echo "Environment: $APP_ENV"
echo "Port: $PORT"

# Start PHP built-in server
echo "Starting PHP server on port $PORT..."
cd frontend && php -S 0.0.0.0:$PORT -t . ../backend/index.php
