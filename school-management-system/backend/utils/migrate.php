<?php
/**
 * Database Migration Script
 * Creates all database tables and structures
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance();
    
    echo "Starting database migration...\n";
    
    // Read and execute schema file
    $schemaFile = __DIR__ . '/../../database/schema.sql';
    
    if (!file_exists($schemaFile)) {
        throw new Exception("Schema file not found: {$schemaFile}");
    }
    
    $schema = file_get_contents($schemaFile);
    
    if ($schema === false) {
        throw new Exception("Failed to read schema file");
    }
    
    // Split schema into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $schema)),
        function($statement) {
            return !empty($statement) && !preg_match('/^\s*--/', $statement);
        }
    );
    
    $executedStatements = 0;
    
    foreach ($statements as $statement) {
        try {
            $db->query($statement);
            $executedStatements++;
            
            // Extract table name for logging
            if (preg_match('/CREATE TABLE\s+(\w+)/i', $statement, $matches)) {
                echo "Created table: {$matches[1]}\n";
            } elseif (preg_match('/CREATE\s+(\w+)/i', $statement, $matches)) {
                echo "Created {$matches[1]}\n";
            }
            
        } catch (Exception $e) {
            // Skip if table already exists
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "Skipped (already exists): " . substr($statement, 0, 50) . "...\n";
                continue;
            }
            
            echo "Error executing statement: " . substr($statement, 0, 100) . "...\n";
            echo "Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nMigration completed successfully!\n";
    echo "Executed {$executedStatements} statements.\n";
    
    // Initialize default settings
    echo "\nInitializing default settings...\n";
    require_once __DIR__ . '/../controllers/SettingsController.php';
    $settingsController = new SettingsController();
    $settingsController->initializeDefaultSettings();
    echo "Default settings initialized.\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
