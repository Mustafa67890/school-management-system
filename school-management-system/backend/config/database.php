<?php
/**
 * Database Connection Class
 * Handles PostgreSQL database connections and operations
 */

class Database {
    private static $instance = null;
    private $connection = null;
    private $host;
    private $port;
    private $dbname;
    private $username;
    private $password;

    private function __construct() {
        $this->host = DB_HOST;
        $this->port = DB_PORT;
        $this->dbname = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASSWORD;
        
        $this->connect();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function connect() {
        try {
            // Determine DSN based on database type
            $dbType = defined('DB_TYPE') ? DB_TYPE : 'sqlite';
            
            switch ($dbType) {
                case 'sqlite':
                    // Create database directory if it doesn't exist
                    $dbDir = dirname($this->dbname);
                    if (!is_dir($dbDir)) {
                        mkdir($dbDir, 0755, true);
                    }
                    $dsn = "sqlite:{$this->dbname}";
                    break;
                    
                case 'mysql':
                    $dsn = "mysql:host={$this->host};port={$this->port};dbname=" . basename($this->dbname) . ";charset=utf8mb4";
                    break;
                    
                case 'pgsql':
                default:
                    $dsn = "pgsql:host={$this->host};port={$this->port};dbname=" . basename($this->dbname);
                    break;
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];

            // Add persistent connection for non-SQLite databases
            if ($dbType !== 'sqlite') {
                $options[PDO::ATTR_PERSISTENT] = true;
            }

            // Create connection
            if ($dbType === 'sqlite') {
                $this->connection = new PDO($dsn, null, null, $options);
            } else {
                $this->connection = new PDO($dsn, $this->username, $this->password, $options);
            }
            
            // Set timezone and other settings based on database type
            if ($dbType === 'pgsql') {
                $this->connection->exec("SET timezone = 'Africa/Dar_es_Salaam'");
            } elseif ($dbType === 'mysql') {
                $this->connection->exec("SET time_zone = '+03:00'");
            }
            
            // Enable foreign keys for SQLite
            if ($dbType === 'sqlite') {
                $this->connection->exec("PRAGMA foreign_keys = ON");
            }
            
            if (isDevelopment()) {
                error_log("Database connected successfully using {$dbType}");
            }
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed", 500);
        }
    }

    public function getConnection() {
        // Check if connection is still alive
        if ($this->connection === null) {
            $this->connect();
        }
        
        try {
            $this->connection->query('SELECT 1');
        } catch (PDOException $e) {
            // Reconnect if connection is lost
            $this->connect();
        }
        
        return $this->connection;
    }

    public function query($sql, $params = []) {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage() . " SQL: " . $sql);
            throw new Exception("Database query failed: " . $e->getMessage(), 500);
        }
    }

    public function select($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function selectOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    public function insert($table, $data) {
        try {
            // Add UUID if not provided
            if (!isset($data['id'])) {
                $data['id'] = $this->generateUUID();
            }

            // Add timestamps
            if (!isset($data['created_at'])) {
                $data['created_at'] = date('Y-m-d H:i:s');
            }
            if (!isset($data['updated_at'])) {
                $data['updated_at'] = date('Y-m-d H:i:s');
            }

            $fields = array_keys($data);
            $placeholders = ':' . implode(', :', $fields);
            
            $sql = "INSERT INTO {$table} (" . implode(', ', $fields) . ") VALUES ({$placeholders}) RETURNING *";
            
            $stmt = $this->query($sql, $data);
            return $stmt->fetch();
            
        } catch (PDOException $e) {
            error_log("Insert error: " . $e->getMessage());
            throw new Exception("Failed to insert record: " . $e->getMessage(), 500);
        }
    }

    public function update($table, $data, $where, $whereParams = []) {
        try {
            // Add updated timestamp
            $data['updated_at'] = date('Y-m-d H:i:s');
            
            $setParts = [];
            foreach (array_keys($data) as $field) {
                $setParts[] = "{$field} = :{$field}";
            }
            
            $sql = "UPDATE {$table} SET " . implode(', ', $setParts) . " WHERE {$where} RETURNING *";
            
            $params = array_merge($data, $whereParams);
            $stmt = $this->query($sql, $params);
            return $stmt->fetch();
            
        } catch (PDOException $e) {
            error_log("Update error: " . $e->getMessage());
            throw new Exception("Failed to update record: " . $e->getMessage(), 500);
        }
    }

    public function delete($table, $where, $whereParams = []) {
        try {
            $sql = "DELETE FROM {$table} WHERE {$where} RETURNING *";
            $stmt = $this->query($sql, $whereParams);
            return $stmt->fetch();
            
        } catch (PDOException $e) {
            error_log("Delete error: " . $e->getMessage());
            throw new Exception("Failed to delete record: " . $e->getMessage(), 500);
        }
    }

    public function count($table, $where = '', $whereParams = []) {
        try {
            $sql = "SELECT COUNT(*) as count FROM {$table}";
            if (!empty($where)) {
                $sql .= " WHERE {$where}";
            }
            
            $result = $this->selectOne($sql, $whereParams);
            return (int) $result['count'];
            
        } catch (PDOException $e) {
            error_log("Count error: " . $e->getMessage());
            throw new Exception("Failed to count records: " . $e->getMessage(), 500);
        }
    }

    public function exists($table, $where, $whereParams = []) {
        return $this->count($table, $where, $whereParams) > 0;
    }

    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }

    public function commit() {
        return $this->getConnection()->commit();
    }

    public function rollback() {
        return $this->getConnection()->rollback();
    }

    public function lastInsertId() {
        return $this->getConnection()->lastInsertId();
    }

    public function generateUUID() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    public function escape($value) {
        return $this->getConnection()->quote($value);
    }

    public function getTableColumns($table) {
        try {
            $sql = "SELECT column_name FROM information_schema.columns WHERE table_name = :table ORDER BY ordinal_position";
            $stmt = $this->query($sql, ['table' => $table]);
            return array_column($stmt->fetchAll(), 'column_name');
        } catch (PDOException $e) {
            error_log("Get columns error: " . $e->getMessage());
            return [];
        }
    }

    public function __destruct() {
        $this->connection = null;
    }
}

// Helper functions for global access
function getDB() {
    return Database::getInstance();
}

function testDatabaseConnection() {
    try {
        $db = Database::getInstance();
        // Use DATETIME('now') for SQLite compatibility instead of NOW()
        $result = $db->selectOne("SELECT DATETIME('now') as current_time");
        return !empty($result);
    } catch (Exception $e) {
        error_log("Database test failed: " . $e->getMessage());
        return false;
    }
}

function executeQuery($sql, $params = []) {
    return getDB()->query($sql, $params);
}

function selectData($sql, $params = []) {
    return getDB()->select($sql, $params);
}

function selectOneData($sql, $params = []) {
    return getDB()->selectOne($sql, $params);
}

function insertData($table, $data) {
    return getDB()->insert($table, $data);
}

function updateData($table, $data, $where, $whereParams = []) {
    return getDB()->update($table, $data, $where, $whereParams);
}

function deleteData($table, $where, $whereParams = []) {
    return getDB()->delete($table, $where, $whereParams);
}

function countData($table, $where = '', $whereParams = []) {
    return getDB()->count($table, $where, $whereParams);
}

function dataExists($table, $where, $whereParams = []) {
    return getDB()->exists($table, $where, $whereParams);
}
?>
