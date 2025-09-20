<?php
/**
 * Global Helper Functions
 * Common utility functions used throughout the application
 */

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400, $details = null) {
    $error = [
        'error' => true,
        'message' => $message,
        'timestamp' => date('c')
    ];
    
    if ($details && isDevelopment()) {
        $error['details'] = $details;
    }
    
    sendResponse($error, $statusCode);
}

/**
 * Send success response
 */
function sendSuccess($data = null, $message = 'Success', $statusCode = 200) {
    $response = [
        'success' => true,
        'message' => $message,
        'timestamp' => date('c')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    sendResponse($response, $statusCode);
}

/**
 * Get request body as JSON
 */
function getRequestBody() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON in request body', 400);
    }
    
    return $data ?: [];
}

/**
 * Validate required fields
 */
function validateRequired($data, $requiredFields) {
    $missing = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }
}

/**
 * Sanitize input data
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email format
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number (Tanzanian format)
 */
function isValidPhone($phone) {
    // Remove spaces and special characters
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    
    // Check Tanzanian phone number patterns
    $patterns = [
        '/^(\+255|0)[67]\d{8}$/',  // Mobile numbers
        '/^(\+255|0)[2-5]\d{7}$/' // Landline numbers
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $phone)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Format currency (Tanzanian Shillings)
 */
function formatCurrency($amount) {
    return 'TZS ' . number_format($amount, 2);
}

/**
 * Format date for display
 */
function formatDate($date, $format = 'Y-m-d H:i:s') {
    if (empty($date)) return '';
    
    try {
        $dateObj = new DateTime($date);
        return $dateObj->format($format);
    } catch (Exception $e) {
        return $date;
    }
}

/**
 * Generate random string
 */
function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    
    return $randomString;
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Log message to file
 */
function logMessage($message, $level = 'INFO') {
    if (!LOG_ENABLED) return;
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    
    file_put_contents(LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Get pagination parameters
 */
function getPaginationParams() {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(MAX_PAGE_SIZE, max(1, intval($_GET['limit']))) : DEFAULT_PAGE_SIZE;
    $offset = ($page - 1) * $limit;
    
    return [
        'page' => $page,
        'limit' => $limit,
        'offset' => $offset
    ];
}

/**
 * Build pagination response
 */
function buildPaginationResponse($data, $total, $page, $limit) {
    return [
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit),
            'has_next' => $page < ceil($total / $limit),
            'has_prev' => $page > 1
        ]
    ];
}

/**
 * Upload file
 */
function uploadFile($file, $allowedTypes = null, $maxSize = null) {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload failed');
    }
    
    $allowedTypes = $allowedTypes ?: ALLOWED_FILE_TYPES;
    $maxSize = $maxSize ?: MAX_FILE_SIZE;
    
    // Check file size
    if ($file['size'] > $maxSize) {
        throw new Exception('File size exceeds maximum allowed size');
    }
    
    // Check file type
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($fileExtension, $allowedTypes)) {
        throw new Exception('File type not allowed');
    }
    
    // Generate unique filename
    $filename = generateRandomString(20) . '.' . $fileExtension;
    $uploadPath = UPLOAD_DIR . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    return $filename;
}

/**
 * Delete file
 */
function deleteFile($filename) {
    $filePath = UPLOAD_DIR . $filename;
    if (file_exists($filePath)) {
        return unlink($filePath);
    }
    return true;
}

/**
 * Get file URL
 */
function getFileUrl($filename) {
    if (empty($filename)) return null;
    return API_BASE_URL . '/uploads/' . $filename;
}

/**
 * Check if user has permission
 */
function hasPermission($userRole, $resource, $action) {
    $permissions = [
        'admin' => [
            'students' => ['create', 'read', 'update', 'delete'],
            'fees' => ['create', 'read', 'update', 'delete'],
            'staff' => ['create', 'read', 'update', 'delete'],
            'payroll' => ['create', 'read', 'update', 'delete'],
            'procurement' => ['create', 'read', 'update', 'delete'],
            'inventory' => ['create', 'read', 'update', 'delete'],
            'reports' => ['read'],
            'settings' => ['create', 'read', 'update', 'delete']
        ],
        'head_teacher' => [
            'students' => ['create', 'read', 'update', 'delete'],
            'fees' => ['read', 'update'],
            'staff' => ['create', 'read', 'update'],
            'payroll' => ['read', 'update'],
            'procurement' => ['read', 'update'],
            'inventory' => ['read'],
            'reports' => ['read'],
            'settings' => ['read', 'update']
        ],
        'teacher' => [
            'students' => ['read', 'update'],
            'fees' => ['read'],
            'staff' => ['read'],
            'payroll' => [],
            'procurement' => [],
            'inventory' => [],
            'reports' => ['read'],
            'settings' => ['read']
        ],
        'accountant' => [
            'students' => ['read'],
            'fees' => ['create', 'read', 'update', 'delete'],
            'staff' => ['read'],
            'payroll' => ['create', 'read', 'update', 'delete'],
            'procurement' => ['create', 'read', 'update', 'delete'],
            'inventory' => ['read', 'update'],
            'reports' => ['read'],
            'settings' => ['read']
        ]
    ];
    
    return isset($permissions[$userRole][$resource]) && 
           in_array($action, $permissions[$userRole][$resource]);
}

/**
 * Generate receipt number
 */
function generateReceiptNumber($prefix = 'RC') {
    $year = date('Y');
    $timestamp = time();
    $random = rand(100, 999);
    
    return $prefix . '-' . $year . '-' . $timestamp . $random;
}

/**
 * Generate staff number
 */
function generateStaffNumber($prefix = 'STF') {
    $year = date('Y');
    $random = rand(1000, 9999);
    
    return $prefix . $year . $random;
}

/**
 * Generate student ID
 */
function generateStudentId($prefix = 'STD') {
    $year = date('Y');
    $random = rand(1000, 9999);
    
    return $prefix . $year . $random;
}

/**
 * Calculate age from date of birth
 */
function calculateAge($dateOfBirth) {
    if (empty($dateOfBirth)) return null;
    
    try {
        $dob = new DateTime($dateOfBirth);
        $now = new DateTime();
        $age = $now->diff($dob);
        return $age->y;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Get academic year from date
 */
function getAcademicYear($date = null) {
    $date = $date ?: date('Y-m-d');
    $year = date('Y', strtotime($date));
    $month = date('n', strtotime($date));
    
    // Academic year starts in January
    return $month >= 1 ? $year : $year - 1;
}

/**
 * Get current term based on date
 */
function getCurrentTerm($date = null) {
    $date = $date ?: date('Y-m-d');
    $month = date('n', strtotime($date));
    
    if ($month >= 1 && $month <= 4) {
        return 'Term 1';
    } elseif ($month >= 5 && $month <= 8) {
        return 'Term 2';
    } else {
        return 'Term 3';
    }
}

/**
 * Convert array to CSV
 */
function arrayToCsv($data, $filename = 'export.csv') {
    if (empty($data)) return;
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    
    // Write header
    fputcsv($output, array_keys($data[0]));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
    
    fclose($output);
    exit();
}

?>
