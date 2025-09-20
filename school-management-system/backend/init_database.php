<?php
/**
 * Database Initialization Script
 * Creates and populates the SQLite database with demo data
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

try {
    echo "Initializing SQLite database...\n";
    
    // Get database instance
    $db = Database::getInstance();
    
    // Read SQL file
    $sqlFile = __DIR__ . '/database/init_sqlite.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    if ($sql === false) {
        throw new Exception("Failed to read SQL file");
    }
    
    // Execute the entire SQL file at once for SQLite
    $connection = $db->getConnection();
    
    echo "Executing SQL file...\n";
    
    try {
        // For SQLite, we can execute multiple statements at once
        $connection->exec($sql);
        echo "✅ SQL executed successfully!\n";
    } catch (PDOException $e) {
        echo "❌ SQL execution failed: " . $e->getMessage() . "\n";
        throw $e;
    }
    
    echo "\n✅ Database initialized successfully!\n";
    echo "Database location: " . DB_NAME . "\n";
    
    // Test the connection
    $result = $db->selectOne("SELECT COUNT(*) as count FROM users");
    echo "Users in database: " . $result['count'] . "\n";
    
    $result = $db->selectOne("SELECT COUNT(*) as count FROM students");
    echo "Students in database: " . $result['count'] . "\n";
    
    echo "\n🎉 Ready to use!\n";
    echo "You can now start the server with: php -S localhost:8000\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
