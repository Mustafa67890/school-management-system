# School Management System - PHP Backend API

A comprehensive REST API backend for the School Management System built with PHP and PostgreSQL, designed specifically for Tanzanian schools.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based permissions
- **Student Management**: Complete CRUD operations for student records
- **Fee Management**: Fee structure and payment tracking
- **Staff Management**: Staff records and payroll processing
- **Procurement**: Purchase orders, suppliers, and inventory management
- **Reports & Analytics**: Comprehensive reporting across all modules
- **Settings**: System configuration and backup/restore functionality

## Requirements

- PHP 7.4 or higher
- PostgreSQL 12 or higher
- Apache/Nginx web server
- PHP Extensions:
  - PDO PostgreSQL
  - JSON
  - OpenSSL
  - Fileinfo

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-management-system/backend
```

### 2. Configure Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE school_management;
```

2. Update database configuration in `config/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'school_management');
define('DB_USER', 'your_username');
define('DB_PASSWORD', 'your_password');
```

### 3. Run Database Migration

```bash
php utils/migrate.php
```

### 4. Seed Sample Data (Optional)

```bash
php utils/seed.php
```

### 5. Configure Web Server

#### Apache
Ensure mod_rewrite is enabled and the `.htaccess` file is properly configured.

#### Nginx
Add the following to your server configuration:
```nginx
location /backend {
    try_files $uri $uri/ /backend/index.php?$query_string;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/{id}` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student
- `GET /api/students/stats` - Get student statistics

### Fees
- `GET /api/fees/structure` - Get fee structures
- `POST /api/fees/structure` - Create fee structure
- `GET /api/fees/payments` - Get all payments
- `POST /api/fees/payments` - Record payment
- `GET /api/fees/{student_id}/payments` - Get student payments

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/{id}` - Get staff by ID
- `POST /api/staff` - Create new staff
- `PUT /api/staff/{id}` - Update staff
- `DELETE /api/staff/{id}` - Delete staff

### Payroll
- `GET /api/payroll/runs` - Get payroll runs
- `POST /api/payroll/runs` - Create payroll run
- `POST /api/payroll/{run_id}/calculate` - Calculate payroll
- `POST /api/payroll/{run_id}/approve` - Approve payroll

### Procurement
- `GET /api/procurement/suppliers` - Get suppliers
- `POST /api/procurement/suppliers` - Create supplier
- `GET /api/procurement/purchase-orders` - Get purchase orders
- `POST /api/procurement/purchase-orders` - Create purchase order

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/financial` - Financial reports
- `GET /api/reports/students` - Student reports
- `GET /api/reports/staff` - Staff reports

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/backup` - Create backup
- `POST /api/settings/restore` - Restore backup

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Users

After seeding, the following users are available:

- **Admin**: `admin` / `admin123`
- **Teacher**: `teacher` / `teacher123`
- **Accountant**: `accountant` / `account123`
- **Head Teacher**: `headteacher` / `head123`

## Permissions

The system implements role-based access control:

- **Admin**: Full access to all modules
- **Head Teacher**: Full access except system settings
- **Teacher**: Students, fees (read), reports
- **Accountant**: Fees, payroll, procurement, reports

## Error Handling

The API returns consistent error responses:

```json
{
  "error": true,
  "message": "Error description",
  "timestamp": "2024-01-15T10:30:00+00:00"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Configuration

### Environment Variables

Key configuration options in `config/config.php`:

```php
// Environment
define('ENVIRONMENT', 'development'); // development, production, testing

// JWT Settings
define('JWT_SECRET', 'your-secret-key');
define('JWT_EXPIRES_IN', 8 * 60 * 60); // 8 hours

// Security
define('BCRYPT_COST', 12);
define('MAX_LOGIN_ATTEMPTS', 5);

// File Upload
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'pdf']);
```

### Logging

Logs are stored in `logs/app.log`. Configure logging in `config/config.php`:

```php
define('LOG_ENABLED', true);
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting for login attempts
- Input validation and sanitization
- SQL injection prevention with prepared statements
- CORS configuration
- Security headers

## Backup & Restore

### Create Backup
```bash
curl -X POST http://your-domain/backend/api/settings/backup \
  -H "Authorization: Bearer <token>"
```

### Restore Backup
```bash
curl -X POST http://your-domain/backend/api/settings/restore \
  -H "Authorization: Bearer <token>" \
  -F "backup_file=@backup.json"
```

## Development

### Running in Development Mode

1. Set environment to development in `config/config.php`
2. Enable error reporting and logging
3. Use the health check endpoint: `GET /api/health`

### Testing API Endpoints

Use tools like Postman or curl to test endpoints:

```bash
# Login
curl -X POST http://localhost/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get students
curl -X GET http://localhost/backend/api/students \
  -H "Authorization: Bearer <token>"
```

## Deployment

### Production Checklist

1. Set `ENVIRONMENT` to `production`
2. Change default JWT secret
3. Update database credentials
4. Configure proper file permissions
5. Enable HTTPS
6. Set up regular backups
7. Configure log rotation

### File Permissions

```bash
chmod 755 backend/
chmod 644 backend/*.php
chmod 600 backend/config/config.php
chmod 755 backend/uploads/
chmod 755 backend/logs/
chmod 755 backend/cache/
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `config/config.php`
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Permission Denied**
   - Check file permissions
   - Ensure web server can write to uploads, logs, cache directories

3. **JWT Token Invalid**
   - Check JWT_SECRET configuration
   - Verify token hasn't expired
   - Ensure proper Authorization header format

4. **CORS Issues**
   - Update CORS configuration in `index.php`
   - Check `.htaccess` CORS headers

### Debug Mode

Enable debug mode by setting:
```php
define('ENVIRONMENT', 'development');
```

This will show detailed error messages and stack traces.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**School Management System Backend API v1.0.0**  
Built for Tanzanian Schools with ❤️
