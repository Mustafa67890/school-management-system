<?php
/**
 * Database Seeding Script
 * Populates database with sample data
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance();
    
    echo "Starting database seeding...\n";
    
    // Read and execute seed file
    $seedFile = __DIR__ . '/../../database/seed.sql';
    
    if (!file_exists($seedFile)) {
        throw new Exception("Seed file not found: {$seedFile}");
    }
    
    $seed = file_get_contents($seedFile);
    
    if ($seed === false) {
        throw new Exception("Failed to read seed file");
    }
    
    // Split seed into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $seed)),
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
            if (preg_match('/INSERT INTO\s+(\w+)/i', $statement, $matches)) {
                echo "Seeded data into: {$matches[1]}\n";
            }
            
        } catch (Exception $e) {
            // Skip if data already exists (duplicate key)
            if (strpos($e->getMessage(), 'duplicate key') !== false || 
                strpos($e->getMessage(), 'already exists') !== false) {
                echo "Skipped (already exists): " . substr($statement, 0, 50) . "...\n";
                continue;
            }
            
            echo "Error executing statement: " . substr($statement, 0, 100) . "...\n";
            echo "Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nSeeding completed successfully!\n";
    echo "Executed {$executedStatements} statements.\n";
    
} catch (Exception $e) {
    echo "Seeding failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
