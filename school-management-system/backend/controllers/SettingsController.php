<?php
/**
 * Settings Controller
 * Handles system settings and configuration
 */

require_once __DIR__ . '/BaseController.php';

class SettingsController extends BaseController {
    
    protected function getResourceName() {
        return 'settings';
    }
    
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            $this->currentUser = getCurrentUser();
            
            // Handle settings-specific endpoints
            switch ($method) {
                case 'GET':
                    if ($resource) {
                        $this->getSetting($resource);
                    } else {
                        $this->getAllSettings();
                    }
                    break;
                    
                case 'POST':
                    if ($resource === 'backup') {
                        $this->createBackup();
                    } elseif ($resource === 'restore') {
                        $this->restoreBackup();
                    } else {
                        $this->updateSettings();
                    }
                    break;
                    
                case 'PUT':
                    if ($resource) {
                        $this->updateSetting($resource);
                    } else {
                        $this->updateSettings();
                    }
                    break;
                    
                case 'DELETE':
                    if ($resource === 'cache') {
                        $this->clearCache();
                    } else {
                        sendError('Invalid delete operation', 400);
                    }
                    break;
                    
                default:
                    sendError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log("Settings Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Get all system settings
     */
    private function getAllSettings() {
        $this->requirePermission('read');
        
        $settings = $this->db->select(
            "SELECT * FROM system_settings ORDER BY category, setting_key"
        );
        
        // Group settings by category
        $groupedSettings = [];
        foreach ($settings as $setting) {
            $category = $setting['category'];
            if (!isset($groupedSettings[$category])) {
                $groupedSettings[$category] = [];
            }
            
            $groupedSettings[$category][$setting['setting_key']] = [
                'value' => $setting['setting_value'],
                'description' => $setting['description'],
                'data_type' => $setting['data_type'],
                'updated_at' => $setting['updated_at']
            ];
        }
        
        // Add system information
        $systemInfo = [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'database_version' => $this->getDatabaseVersion(),
            'timezone' => date_default_timezone_get(),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'disk_space' => $this->getDiskSpace()
        ];
        
        sendSuccess([
            'settings' => $groupedSettings,
            'system_info' => $systemInfo
        ]);
    }
    
    /**
     * Get specific setting
     */
    private function getSetting($key) {
        $this->requirePermission('read');
        
        $setting = $this->db->selectOne(
            "SELECT * FROM system_settings WHERE setting_key = :key",
            ['key' => $key]
        );
        
        if (!$setting) {
            sendError('Setting not found', 404);
        }
        
        sendSuccess($setting);
    }
    
    /**
     * Update system settings
     */
    private function updateSettings() {
        $this->requirePermission('update');
        
        $data = getRequestBody();
        
        if (empty($data) || !is_array($data)) {
            sendError('Invalid settings data', 400);
        }
        
        $updatedSettings = [];
        $errors = [];
        
        foreach ($data as $key => $value) {
            try {
                $this->updateSingleSetting($key, $value);
                $updatedSettings[] = $key;
            } catch (Exception $e) {
                $errors[$key] = $e->getMessage();
            }
        }
        
        $response = [
            'updated_settings' => $updatedSettings,
            'updated_count' => count($updatedSettings)
        ];
        
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        
        sendSuccess($response, 'Settings updated successfully');
    }
    
    /**
     * Update single setting
     */
    private function updateSetting($key) {
        $this->requirePermission('update');
        
        $data = getRequestBody();
        
        if (!isset($data['value'])) {
            sendError('Setting value is required', 400);
        }
        
        $this->updateSingleSetting($key, $data['value']);
        
        sendSuccess(null, 'Setting updated successfully');
    }
    
    /**
     * Update single setting (internal method)
     */
    private function updateSingleSetting($key, $value) {
        // Get existing setting
        $existing = $this->db->selectOne(
            "SELECT * FROM system_settings WHERE setting_key = :key",
            ['key' => $key]
        );
        
        if (!$existing) {
            throw new Exception("Setting '{$key}' not found");
        }
        
        // Validate value based on data type
        $validatedValue = $this->validateSettingValue($value, $existing['data_type']);
        
        // Update setting
        $this->db->update('system_settings', 
            [
                'setting_value' => $validatedValue,
                'updated_by' => $this->currentUser['id']
            ], 
            'setting_key = :key', 
            ['key' => $key]
        );
        
        // Log the change
        logMessage("Setting '{$key}' updated by {$this->currentUser['username']}", 'INFO');
    }
    
    /**
     * Validate setting value based on data type
     */
    private function validateSettingValue($value, $dataType) {
        switch ($dataType) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                
            case 'integer':
                if (!is_numeric($value) || intval($value) != $value) {
                    throw new Exception('Value must be an integer');
                }
                return strval(intval($value));
                
            case 'decimal':
                if (!is_numeric($value)) {
                    throw new Exception('Value must be a number');
                }
                return strval(floatval($value));
                
            case 'email':
                if (!isValidEmail($value)) {
                    throw new Exception('Value must be a valid email address');
                }
                return $value;
                
            case 'url':
                if (!filter_var($value, FILTER_VALIDATE_URL)) {
                    throw new Exception('Value must be a valid URL');
                }
                return $value;
                
            case 'json':
                $decoded = json_decode($value, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception('Value must be valid JSON');
                }
                return $value;
                
            case 'string':
            default:
                return strval($value);
        }
    }
    
    /**
     * Create system backup
     */
    private function createBackup() {
        $this->requirePermission('create');
        
        $backupData = [
            'timestamp' => date('c'),
            'created_by' => $this->currentUser['username'],
            'version' => APP_VERSION,
            'data' => []
        ];
        
        // Get all tables data
        $tables = [
            'users', 'students', 'fee_structure', 'student_payments',
            'staff', 'payroll_runs', 'payroll_entries',
            'suppliers', 'purchase_orders', 'purchase_order_items',
            'system_settings'
        ];
        
        foreach ($tables as $table) {
            try {
                $data = $this->db->select("SELECT * FROM {$table}");
                $backupData['data'][$table] = $data;
            } catch (Exception $e) {
                logMessage("Error backing up table {$table}: " . $e->getMessage(), 'WARNING');
            }
        }
        
        // Create backup file
        $backupDir = __DIR__ . '/../backups/';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.json';
        $filepath = $backupDir . $filename;
        
        if (file_put_contents($filepath, json_encode($backupData, JSON_PRETTY_PRINT))) {
            logMessage("System backup created: {$filename}", 'INFO');
            
            sendSuccess([
                'filename' => $filename,
                'filepath' => $filepath,
                'size' => filesize($filepath),
                'tables_backed_up' => count($backupData['data'])
            ], 'Backup created successfully');
        } else {
            sendError('Failed to create backup file', 500);
        }
    }
    
    /**
     * Restore system backup
     */
    private function restoreBackup() {
        $this->requirePermission('create');
        
        if (!isset($_FILES['backup_file'])) {
            sendError('No backup file uploaded', 400);
        }
        
        $file = $_FILES['backup_file'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendError('File upload failed', 400);
        }
        
        // Validate file type
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($fileExtension !== 'json') {
            sendError('Only JSON backup files are allowed', 400);
        }
        
        // Read and validate backup file
        $backupContent = file_get_contents($file['tmp_name']);
        $backupData = json_decode($backupContent, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Invalid backup file format', 400);
        }
        
        if (!isset($backupData['data']) || !is_array($backupData['data'])) {
            sendError('Invalid backup file structure', 400);
        }
        
        // Start transaction for restore
        $this->db->beginTransaction();
        
        try {
            $restoredTables = [];
            
            foreach ($backupData['data'] as $table => $data) {
                if (empty($data)) continue;
                
                // Clear existing data (be careful!)
                $this->db->query("DELETE FROM {$table}");
                
                // Insert backup data
                foreach ($data as $row) {
                    $this->db->insert($table, $row);
                }
                
                $restoredTables[] = $table;
            }
            
            $this->db->commit();
            
            logMessage("System restored from backup by {$this->currentUser['username']}", 'INFO');
            
            sendSuccess([
                'restored_tables' => $restoredTables,
                'backup_timestamp' => $backupData['timestamp'] ?? 'Unknown'
            ], 'System restored successfully');
            
        } catch (Exception $e) {
            $this->db->rollback();
            logMessage("Backup restore failed: " . $e->getMessage(), 'ERROR');
            sendError('Failed to restore backup: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Clear system cache
     */
    private function clearCache() {
        $this->requirePermission('update');
        
        $cacheDir = __DIR__ . '/../cache/';
        $clearedFiles = 0;
        
        if (is_dir($cacheDir)) {
            $files = glob($cacheDir . '*.cache');
            foreach ($files as $file) {
                if (unlink($file)) {
                    $clearedFiles++;
                }
            }
        }
        
        logMessage("Cache cleared by {$this->currentUser['username']}: {$clearedFiles} files", 'INFO');
        
        sendSuccess([
            'cleared_files' => $clearedFiles
        ], 'Cache cleared successfully');
    }
    
    /**
     * Get database version
     */
    private function getDatabaseVersion() {
        try {
            $result = $this->db->selectOne("SELECT version() as version");
            return $result['version'] ?? 'Unknown';
        } catch (Exception $e) {
            return 'Unknown';
        }
    }
    
    /**
     * Get disk space information
     */
    private function getDiskSpace() {
        try {
            $totalBytes = disk_total_space('.');
            $freeBytes = disk_free_space('.');
            $usedBytes = $totalBytes - $freeBytes;
            
            return [
                'total' => $this->formatBytes($totalBytes),
                'used' => $this->formatBytes($usedBytes),
                'free' => $this->formatBytes($freeBytes),
                'usage_percentage' => round(($usedBytes / $totalBytes) * 100, 2)
            ];
        } catch (Exception $e) {
            return ['error' => 'Unable to get disk space information'];
        }
    }
    
    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
    
    /**
     * Initialize default settings
     */
    public function initializeDefaultSettings() {
        $defaultSettings = [
            // School Information
            ['school', 'school_name', SCHOOL_NAME, 'School Name', 'string'],
            ['school', 'school_address', SCHOOL_ADDRESS, 'School Address', 'string'],
            ['school', 'school_phone', SCHOOL_PHONE, 'School Phone', 'string'],
            ['school', 'school_email', SCHOOL_EMAIL, 'School Email', 'email'],
            
            // Academic Settings
            ['academic', 'current_academic_year', CURRENT_ACADEMIC_YEAR, 'Current Academic Year', 'string'],
            ['academic', 'current_term', CURRENT_TERM, 'Current Term', 'string'],
            
            // System Settings
            ['system', 'default_language', 'en', 'Default Language', 'string'],
            ['system', 'default_currency', DEFAULT_CURRENCY, 'Default Currency', 'string'],
            ['system', 'timezone', DEFAULT_TIMEZONE, 'System Timezone', 'string'],
            ['system', 'date_format', 'Y-m-d', 'Date Format', 'string'],
            
            // Security Settings
            ['security', 'session_timeout', strval(SESSION_TIMEOUT), 'Session Timeout (seconds)', 'integer'],
            ['security', 'max_login_attempts', strval(MAX_LOGIN_ATTEMPTS), 'Maximum Login Attempts', 'integer'],
            ['security', 'password_min_length', '8', 'Minimum Password Length', 'integer'],
            
            // Email Settings
            ['email', 'smtp_host', SMTP_HOST, 'SMTP Host', 'string'],
            ['email', 'smtp_port', strval(SMTP_PORT), 'SMTP Port', 'integer'],
            ['email', 'smtp_username', SMTP_USERNAME, 'SMTP Username', 'string'],
            ['email', 'from_email', FROM_EMAIL, 'From Email', 'email'],
            ['email', 'from_name', FROM_NAME, 'From Name', 'string'],
            
            // Backup Settings
            ['backup', 'auto_backup_enabled', 'false', 'Enable Automatic Backup', 'boolean'],
            ['backup', 'backup_frequency', 'weekly', 'Backup Frequency', 'string'],
            ['backup', 'backup_retention_days', '30', 'Backup Retention (days)', 'integer']
        ];
        
        foreach ($defaultSettings as $setting) {
            $existing = $this->db->selectOne(
                "SELECT id FROM system_settings WHERE setting_key = :key",
                ['key' => $setting[1]]
            );
            
            if (!$existing) {
                $this->db->insert('system_settings', [
                    'category' => $setting[0],
                    'setting_key' => $setting[1],
                    'setting_value' => $setting[2],
                    'description' => $setting[3],
                    'data_type' => $setting[4]
                ]);
            }
        }
    }
    
    // Required by BaseController but not used in SettingsController
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
