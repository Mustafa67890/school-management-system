<?php
/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 */

/**
 * Generate JWT token
 */
function generateJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);
    
    $headerEncoded = base64url_encode($header);
    $payloadEncoded = base64url_encode($payload);
    
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = base64url_encode($signature);
    
    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

/**
 * Verify JWT token
 */
function verifyJWT($token) {
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
    
    $signature = base64url_decode($signatureEncoded);
    $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    
    if (!hash_equals($signature, $expectedSignature)) {
        return false;
    }
    
    $payload = json_decode(base64url_decode($payloadEncoded), true);
    
    // Check expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

/**
 * Base64 URL encode
 */
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL decode
 */
function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
    $token = getBearerToken();
    
    if (!$token) {
        return null;
    }
    
    $payload = verifyJWT($token);
    
    if (!$payload) {
        return null;
    }
    
    // Get user from database
    try {
        $db = getDB();
        $user = $db->selectOne(
            "SELECT id, username, email, full_name, role, phone, is_active, last_login FROM users WHERE id = :id AND is_active = true",
            ['id' => $payload['user_id']]
        );
        
        return $user;
    } catch (Exception $e) {
        error_log("Get current user error: " . $e->getMessage());
        return null;
    }
}

/**
 * Get Bearer token from Authorization header
 */
function getBearerToken() {
    $headers = getAuthorizationHeader();
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

/**
 * Get Authorization header
 */
function getAuthorizationHeader() {
    $headers = null;
    
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    return $headers;
}

/**
 * Require authentication
 */
function requireAuth() {
    $user = getCurrentUser();
    
    if (!$user) {
        sendError('Authentication required', 401);
    }
    
    return $user;
}

/**
 * Require specific role
 */
function requireRole($requiredRoles) {
    $user = requireAuth();
    
    if (!is_array($requiredRoles)) {
        $requiredRoles = [$requiredRoles];
    }
    
    if (!in_array($user['role'], $requiredRoles)) {
        sendError('Insufficient permissions', 403);
    }
    
    return $user;
}

/**
 * Require permission for resource and action
 */
function requirePermission($resource, $action) {
    $user = requireAuth();
    
    if (!hasPermission($user['role'], $resource, $action)) {
        sendError('Insufficient permissions for this action', 403);
    }
    
    return $user;
}

/**
 * Login user and generate token
 */
function loginUser($username, $password) {
    try {
        $db = getDB();
        
        // Get user by username or email
        $user = $db->selectOne(
            "SELECT * FROM users WHERE (username = :username OR email = :username) AND is_active = true",
            ['username' => $username]
        );
        
        if (!$user) {
            // Check for login attempts
            checkLoginAttempts($username);
            recordLoginAttempt($username, false);
            throw new Exception('Invalid credentials', 401);
        }
        
        // Verify password
        if (!verifyPassword($password, $user['password_hash'])) {
            recordLoginAttempt($username, false);
            throw new Exception('Invalid credentials', 401);
        }
        
        // Check if account is locked
        if (isAccountLocked($username)) {
            throw new Exception('Account is temporarily locked due to multiple failed login attempts', 423);
        }
        
        // Generate JWT token
        $payload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRES_IN
        ];
        
        $token = generateJWT($payload);
        
        // Generate refresh token
        $refreshPayload = [
            'user_id' => $user['id'],
            'type' => 'refresh',
            'iat' => time(),
            'exp' => time() + JWT_REFRESH_EXPIRES_IN
        ];
        
        $refreshToken = generateJWT($refreshPayload);
        
        // Update last login
        $db->update('users', 
            ['last_login' => date('Y-m-d H:i:s')], 
            'id = :id', 
            ['id' => $user['id']]
        );
        
        // Record successful login
        recordLoginAttempt($username, true);
        
        // Remove sensitive data
        unset($user['password_hash']);
        
        return [
            'user' => $user,
            'token' => $token,
            'refresh_token' => $refreshToken,
            'expires_in' => JWT_EXPIRES_IN
        ];
        
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Refresh JWT token
 */
function refreshToken($refreshToken) {
    try {
        $payload = verifyJWT($refreshToken);
        
        if (!$payload || $payload['type'] !== 'refresh') {
            throw new Exception('Invalid refresh token', 401);
        }
        
        $db = getDB();
        $user = $db->selectOne(
            "SELECT * FROM users WHERE id = :id AND is_active = true",
            ['id' => $payload['user_id']]
        );
        
        if (!$user) {
            throw new Exception('User not found', 404);
        }
        
        // Generate new access token
        $newPayload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRES_IN
        ];
        
        $newToken = generateJWT($newPayload);
        
        return [
            'token' => $newToken,
            'expires_in' => JWT_EXPIRES_IN
        ];
        
    } catch (Exception $e) {
        error_log("Refresh token error: " . $e->getMessage());
        throw new Exception('Invalid refresh token', 401);
    }
}

/**
 * Check login attempts for rate limiting
 */
function checkLoginAttempts($username) {
    if (!RATE_LIMIT_ENABLED) return;
    
    $cacheKey = 'login_attempts_' . md5($username);
    $attempts = getFromCache($cacheKey, 0);
    
    if ($attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new Exception('Too many login attempts. Please try again later.', 429);
    }
}

/**
 * Record login attempt
 */
function recordLoginAttempt($username, $success) {
    if (!RATE_LIMIT_ENABLED) return;
    
    $cacheKey = 'login_attempts_' . md5($username);
    
    if ($success) {
        // Clear attempts on successful login
        removeFromCache($cacheKey);
    } else {
        // Increment failed attempts
        $attempts = getFromCache($cacheKey, 0) + 1;
        setCache($cacheKey, $attempts, LOGIN_LOCKOUT_TIME);
    }
}

/**
 * Check if account is locked
 */
function isAccountLocked($username) {
    if (!RATE_LIMIT_ENABLED) return false;
    
    $cacheKey = 'login_attempts_' . md5($username);
    $attempts = getFromCache($cacheKey, 0);
    
    return $attempts >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Simple cache functions (file-based)
 */
function getFromCache($key, $default = null) {
    if (!CACHE_ENABLED) return $default;
    
    $cacheFile = __DIR__ . '/../cache/' . md5($key) . '.cache';
    
    if (!file_exists($cacheFile)) {
        return $default;
    }
    
    $data = file_get_contents($cacheFile);
    $cache = json_decode($data, true);
    
    if (!$cache || $cache['expires'] < time()) {
        unlink($cacheFile);
        return $default;
    }
    
    return $cache['value'];
}

/**
 * Set cache value
 */
function setCache($key, $value, $ttl = null) {
    if (!CACHE_ENABLED) return;
    
    $ttl = $ttl ?: CACHE_TTL;
    $cacheFile = __DIR__ . '/../cache/' . md5($key) . '.cache';
    
    $cache = [
        'value' => $value,
        'expires' => time() + $ttl
    ];
    
    file_put_contents($cacheFile, json_encode($cache));
}

/**
 * Remove from cache
 */
function removeFromCache($key) {
    if (!CACHE_ENABLED) return;
    
    $cacheFile = __DIR__ . '/../cache/' . md5($key) . '.cache';
    
    if (file_exists($cacheFile)) {
        unlink($cacheFile);
    }
}
?>
