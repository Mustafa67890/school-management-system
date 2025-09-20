<?php
/**
 * Authentication Controller
 * Handles user authentication, login, logout, and token management
 */

require_once __DIR__ . '/BaseController.php';

class AuthController extends BaseController {
    
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            // Handle authentication endpoints
            if ($method === 'POST') {
                switch ($resource) {
                    case 'login':
                        $this->handleLogin();
                        break;
                        
                    case 'refresh':
                        $this->handleRefreshToken();
                        break;
                        
                    case 'logout':
                        $this->handleLogout();
                        break;
                        
                    case 'register':
                        $this->handleRegister();
                        break;
                        
                    case 'forgot-password':
                        $this->handleForgotPassword();
                        break;
                        
                    case 'reset-password':
                        $this->handleResetPassword();
                        break;
                        
                    case 'change-password':
                        $this->handleChangePassword();
                        break;
                        
                    default:
                        sendError('Authentication endpoint not found', 404);
                }
            } elseif ($method === 'GET') {
                switch ($resource) {
                    case 'me':
                        $this->handleGetCurrentUser();
                        break;
                        
                    case 'verify':
                        $this->handleVerifyToken();
                        break;
                        
                    default:
                        sendError('Authentication endpoint not found', 404);
                }
            } else {
                sendError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log("Auth Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Handle user login
     */
    private function handleLogin() {
        $data = getRequestBody();
        
        // Validate required fields
        validateRequired($data, ['username', 'password']);
        
        $username = sanitizeInput($data['username']);
        $password = $data['password'];
        
        try {
            $result = loginUser($username, $password);
            
            // Log successful login
            logMessage("User {$username} logged in successfully", 'INFO');
            
            sendSuccess($result, 'Login successful');
            
        } catch (Exception $e) {
            // Log failed login attempt
            logMessage("Failed login attempt for {$username}: " . $e->getMessage(), 'WARNING');
            
            throw $e;
        }
    }
    
    /**
     * Handle token refresh
     */
    private function handleRefreshToken() {
        $data = getRequestBody();
        
        validateRequired($data, ['refresh_token']);
        
        try {
            $result = refreshToken($data['refresh_token']);
            sendSuccess($result, 'Token refreshed successfully');
            
        } catch (Exception $e) {
            sendError('Invalid refresh token', 401);
        }
    }
    
    /**
     * Handle user logout
     */
    private function handleLogout() {
        $user = requireAuth();
        
        // In a more sophisticated system, you would blacklist the token
        // For now, we'll just log the logout
        logMessage("User {$user['username']} logged out", 'INFO');
        
        sendSuccess(null, 'Logout successful');
    }
    
    /**
     * Handle user registration (admin only)
     */
    private function handleRegister() {
        // Only admin can register new users
        requireRole(['admin']);
        
        $data = getRequestBody();
        
        // Validate required fields
        validateRequired($data, ['username', 'email', 'password', 'full_name', 'role']);
        
        // Sanitize input
        $userData = [
            'username' => sanitizeInput($data['username']),
            'email' => sanitizeInput($data['email']),
            'full_name' => sanitizeInput($data['full_name']),
            'role' => sanitizeInput($data['role']),
            'phone' => isset($data['phone']) ? sanitizeInput($data['phone']) : null
        ];
        
        // Validate data
        $this->validateUserData($userData, $data['password']);
        
        // Check if username or email already exists
        if ($this->db->exists('users', 'username = :username OR email = :email', [
            'username' => $userData['username'],
            'email' => $userData['email']
        ])) {
            sendError('Username or email already exists', 409);
        }
        
        // Hash password
        $userData['password_hash'] = hashPassword($data['password']);
        $userData['is_active'] = true;
        
        try {
            $user = $this->db->insert('users', $userData);
            
            // Remove password hash from response
            unset($user['password_hash']);
            
            logMessage("New user registered: {$userData['username']} by {$this->currentUser['username']}", 'INFO');
            
            sendSuccess($user, 'User registered successfully', 201);
            
        } catch (Exception $e) {
            sendError('Failed to register user', 500);
        }
    }
    
    /**
     * Handle forgot password
     */
    private function handleForgotPassword() {
        $data = getRequestBody();
        
        validateRequired($data, ['email']);
        
        $email = sanitizeInput($data['email']);
        
        // Check if user exists
        $user = $this->db->selectOne(
            "SELECT id, email, full_name FROM users WHERE email = :email AND is_active = true",
            ['email' => $email]
        );
        
        if (!$user) {
            // Don't reveal if email exists or not
            sendSuccess(null, 'If the email exists, a reset link has been sent');
            return;
        }
        
        // Generate reset token (in a real system, you'd send this via email)
        $resetToken = generateRandomString(32);
        $resetExpiry = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        
        // Store reset token (you'd typically have a password_resets table)
        setCache('password_reset_' . $user['id'], [
            'token' => $resetToken,
            'expires' => $resetExpiry
        ], 3600);
        
        logMessage("Password reset requested for {$email}", 'INFO');
        
        // In a real system, send email here
        sendSuccess([
            'reset_token' => $resetToken, // Remove this in production
            'message' => 'Reset token generated (check email in production)'
        ], 'If the email exists, a reset link has been sent');
    }
    
    /**
     * Handle password reset
     */
    private function handleResetPassword() {
        $data = getRequestBody();
        
        validateRequired($data, ['email', 'reset_token', 'new_password']);
        
        $email = sanitizeInput($data['email']);
        $resetToken = $data['reset_token'];
        $newPassword = $data['new_password'];
        
        // Validate password
        $this->validatePassword($newPassword);
        
        // Get user
        $user = $this->db->selectOne(
            "SELECT id FROM users WHERE email = :email AND is_active = true",
            ['email' => $email]
        );
        
        if (!$user) {
            sendError('Invalid reset request', 400);
        }
        
        // Verify reset token
        $storedData = getFromCache('password_reset_' . $user['id']);
        
        if (!$storedData || $storedData['token'] !== $resetToken || $storedData['expires'] < date('Y-m-d H:i:s')) {
            sendError('Invalid or expired reset token', 400);
        }
        
        // Update password
        $passwordHash = hashPassword($newPassword);
        
        $this->db->update('users', 
            ['password_hash' => $passwordHash], 
            'id = :id', 
            ['id' => $user['id']]
        );
        
        // Clear reset token
        removeFromCache('password_reset_' . $user['id']);
        
        logMessage("Password reset completed for {$email}", 'INFO');
        
        sendSuccess(null, 'Password reset successfully');
    }
    
    /**
     * Handle password change (authenticated user)
     */
    private function handleChangePassword() {
        $user = requireAuth();
        $data = getRequestBody();
        
        validateRequired($data, ['current_password', 'new_password']);
        
        $currentPassword = $data['current_password'];
        $newPassword = $data['new_password'];
        
        // Get user with password hash
        $userWithPassword = $this->db->selectOne(
            "SELECT password_hash FROM users WHERE id = :id",
            ['id' => $user['id']]
        );
        
        // Verify current password
        if (!verifyPassword($currentPassword, $userWithPassword['password_hash'])) {
            sendError('Current password is incorrect', 400);
        }
        
        // Validate new password
        $this->validatePassword($newPassword);
        
        // Update password
        $passwordHash = hashPassword($newPassword);
        
        $this->db->update('users', 
            ['password_hash' => $passwordHash], 
            'id = :id', 
            ['id' => $user['id']]
        );
        
        logMessage("Password changed for user {$user['username']}", 'INFO');
        
        sendSuccess(null, 'Password changed successfully');
    }
    
    /**
     * Get current authenticated user
     */
    private function handleGetCurrentUser() {
        $user = requireAuth();
        sendSuccess($user);
    }
    
    /**
     * Verify token validity
     */
    private function handleVerifyToken() {
        $user = getCurrentUser();
        
        if ($user) {
            sendSuccess(['valid' => true, 'user' => $user]);
        } else {
            sendSuccess(['valid' => false]);
        }
    }
    
    /**
     * Validate user data
     */
    private function validateUserData($userData, $password) {
        // Validate username
        if (strlen($userData['username']) < 3) {
            sendError('Username must be at least 3 characters long', 400);
        }
        
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $userData['username'])) {
            sendError('Username can only contain letters, numbers, and underscores', 400);
        }
        
        // Validate email
        if (!isValidEmail($userData['email'])) {
            sendError('Invalid email format', 400);
        }
        
        // Validate role
        $allowedRoles = ['admin', 'teacher', 'accountant', 'head_teacher'];
        if (!in_array($userData['role'], $allowedRoles)) {
            sendError('Invalid role', 400);
        }
        
        // Validate phone if provided
        if ($userData['phone'] && !isValidPhone($userData['phone'])) {
            sendError('Invalid phone number format', 400);
        }
        
        // Validate password
        $this->validatePassword($password);
    }
    
    /**
     * Validate password strength
     */
    private function validatePassword($password) {
        if (strlen($password) < 8) {
            sendError('Password must be at least 8 characters long', 400);
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            sendError('Password must contain at least one uppercase letter', 400);
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            sendError('Password must contain at least one lowercase letter', 400);
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            sendError('Password must contain at least one number', 400);
        }
    }
    
    // Required by BaseController but not used in AuthController
    protected function getAll($pagination, $filters, $search) { return []; }
    protected function getOne($id) { return null; }
    protected function getCount($filters, $search) { return 0; }
    protected function create($data) { return null; }
    protected function update($id, $data) { return null; }
    protected function delete($id) { return null; }
    protected function validateCreateData($data) {}
    protected function validateUpdateData($data, $id) {}
}
?>
