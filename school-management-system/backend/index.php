<?php
/**
 * School Management System API
 * Main entry point for all API requests
 * 
 * @author School Management Team
 * @version 1.0.0
 */

// Set error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('Africa/Dar_es_Salaam');

// CORS headers for frontend access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include autoloader and configuration
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/middleware/cors.php';

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/backend', '', $uri); // Remove backend prefix if exists

// Remove leading slash and split URI into segments
$uri = trim($uri, '/');
$segments = explode('/', $uri);

// API routing
try {
    // Health check endpoint
    if ($uri === 'health' || $uri === 'api/health') {
        echo json_encode([
            'status' => 'OK',
            'timestamp' => date('c'),
            'version' => '1.0.0',
            'environment' => ENVIRONMENT,
            'database' => testDatabaseConnection() ? 'connected' : 'disconnected'
        ]);
        exit();
    }

    // API documentation endpoint
    if ($uri === '' || $uri === 'api' || $uri === 'api/') {
        echo json_encode([
            'message' => 'School Management System API',
            'version' => '1.0.0',
            'environment' => ENVIRONMENT,
            'endpoints' => [
                'auth' => '/api/auth',
                'students' => '/api/students',
                'fees' => '/api/fees',
                'staff' => '/api/staff',
                'payroll' => '/api/payroll',
                'procurement' => '/api/procurement',
                'inventory' => '/api/inventory',
                'reports' => '/api/reports',
                'settings' => '/api/settings',
                'health' => '/api/health'
            ],
            'documentation' => 'https://github.com/school-management/api-docs'
        ]);
        exit();
    }

    // Route API requests
    if (count($segments) >= 2 && $segments[0] === 'api') {
        $endpoint = $segments[1];
        $resource = isset($segments[2]) ? $segments[2] : null;
        $action = isset($segments[3]) ? $segments[3] : null;

        // Route to appropriate controller
        switch ($endpoint) {
            case 'auth':
                require_once __DIR__ . '/controllers/AuthController.php';
                $controller = new AuthController();
                break;
                
            case 'students':
                require_once __DIR__ . '/controllers/StudentController.php';
                $controller = new StudentController();
                break;
                
            case 'fees':
                require_once __DIR__ . '/controllers/FeeController.php';
                $controller = new FeeController();
                break;
                
            case 'staff':
                require_once __DIR__ . '/controllers/StaffController.php';
                $controller = new StaffController();
                break;
                
            case 'payroll':
                require_once __DIR__ . '/controllers/PayrollController.php';
                $controller = new PayrollController();
                break;
                
            case 'procurement':
                require_once __DIR__ . '/controllers/ProcurementController.php';
                $controller = new ProcurementController();
                break;
                
            case 'inventory':
                require_once __DIR__ . '/controllers/InventoryController.php';
                $controller = new InventoryController();
                break;
                
            case 'reports':
                require_once __DIR__ . '/controllers/ReportController.php';
                $controller = new ReportController();
                break;
                
            case 'settings':
                require_once __DIR__ . '/controllers/SettingsController.php';
                $controller = new SettingsController();
                break;
                
            default:
                throw new Exception('Endpoint not found', 404);
        }

        // Handle the request
        $controller->handleRequest($method, $resource, $action);
        
    } else {
        throw new Exception('Invalid API endpoint', 404);
    }

} catch (Exception $e) {
    // Handle errors
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);
    
    $error = [
        'error' => true,
        'message' => $e->getMessage(),
        'timestamp' => date('c')
    ];
    
    // Add stack trace in development
    if (ENVIRONMENT === 'development') {
        $error['trace'] = $e->getTraceAsString();
        $error['file'] = $e->getFile();
        $error['line'] = $e->getLine();
    }
    
    echo json_encode($error);
}

// Log request for debugging
if (ENVIRONMENT === 'development') {
    error_log("API Request: $method $uri - " . date('Y-m-d H:i:s'));
}
?>
