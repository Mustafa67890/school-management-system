<?php
/**
 * Base Controller Class
 * Common functionality for all controllers
 */

abstract class BaseController {
    protected $db;
    protected $currentUser;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    /**
     * Handle incoming requests
     */
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            // Get current user for authenticated endpoints
            $this->currentUser = getCurrentUser();
            
            // Route based on HTTP method and resource
            switch ($method) {
                case 'GET':
                    if ($resource && $action) {
                        $this->handleGetAction($resource, $action);
                    } elseif ($resource) {
                        $this->handleGetOne($resource);
                    } else {
                        $this->handleGetAll();
                    }
                    break;
                    
                case 'POST':
                    if ($resource && $action) {
                        $this->handlePostAction($resource, $action);
                    } else {
                        $this->handleCreate();
                    }
                    break;
                    
                case 'PUT':
                    if ($resource) {
                        $this->handleUpdate($resource);
                    } else {
                        sendError('Resource ID required for update', 400);
                    }
                    break;
                    
                case 'DELETE':
                    if ($resource) {
                        $this->handleDelete($resource);
                    } else {
                        sendError('Resource ID required for delete', 400);
                    }
                    break;
                    
                default:
                    sendError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log("Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Handle GET all records
     */
    protected function handleGetAll() {
        $this->requirePermission('read');
        
        $pagination = getPaginationParams();
        $filters = $this->getFilters();
        $search = $this->getSearchQuery();
        
        $data = $this->getAll($pagination, $filters, $search);
        $total = $this->getCount($filters, $search);
        
        $response = buildPaginationResponse($data, $total, $pagination['page'], $pagination['limit']);
        sendSuccess($response);
    }
    
    /**
     * Handle GET one record
     */
    protected function handleGetOne($id) {
        $this->requirePermission('read');
        
        $data = $this->getOne($id);
        
        if (!$data) {
            sendError('Record not found', 404);
        }
        
        sendSuccess($data);
    }
    
    /**
     * Handle CREATE record
     */
    protected function handleCreate() {
        $this->requirePermission('create');
        
        $data = getRequestBody();
        $this->validateCreateData($data);
        
        $record = $this->create($data);
        sendSuccess($record, 'Record created successfully', 201);
    }
    
    /**
     * Handle UPDATE record
     */
    protected function handleUpdate($id) {
        $this->requirePermission('update');
        
        $data = getRequestBody();
        $this->validateUpdateData($data, $id);
        
        $record = $this->update($id, $data);
        
        if (!$record) {
            sendError('Record not found', 404);
        }
        
        sendSuccess($record, 'Record updated successfully');
    }
    
    /**
     * Handle DELETE record
     */
    protected function handleDelete($id) {
        $this->requirePermission('delete');
        
        $record = $this->delete($id);
        
        if (!$record) {
            sendError('Record not found', 404);
        }
        
        sendSuccess(null, 'Record deleted successfully');
    }
    
    /**
     * Handle GET actions (custom endpoints)
     */
    protected function handleGetAction($resource, $action) {
        $methodName = 'get' . ucfirst($action);
        
        if (method_exists($this, $methodName)) {
            $this->$methodName($resource);
        } else {
            sendError('Action not found', 404);
        }
    }
    
    /**
     * Handle POST actions (custom endpoints)
     */
    protected function handlePostAction($resource, $action) {
        $methodName = 'post' . ucfirst($action);
        
        if (method_exists($this, $methodName)) {
            $this->$methodName($resource);
        } else {
            sendError('Action not found', 404);
        }
    }
    
    /**
     * Get filters from query parameters
     */
    protected function getFilters() {
        $filters = [];
        
        // Common filters
        if (isset($_GET['status'])) {
            $filters['status'] = $_GET['status'];
        }
        
        if (isset($_GET['created_from'])) {
            $filters['created_from'] = $_GET['created_from'];
        }
        
        if (isset($_GET['created_to'])) {
            $filters['created_to'] = $_GET['created_to'];
        }
        
        return $filters;
    }
    
    /**
     * Get search query from parameters
     */
    protected function getSearchQuery() {
        return isset($_GET['search']) ? trim($_GET['search']) : '';
    }
    
    /**
     * Build WHERE clause from filters
     */
    protected function buildWhereClause($filters, $search = '', $searchFields = []) {
        $conditions = [];
        $params = [];
        
        // Add filter conditions
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                switch ($field) {
                    case 'status':
                        $conditions[] = "status = :status";
                        $params['status'] = $value;
                        break;
                        
                    case 'created_from':
                        $conditions[] = "created_at >= :created_from";
                        $params['created_from'] = $value . ' 00:00:00';
                        break;
                        
                    case 'created_to':
                        $conditions[] = "created_at <= :created_to";
                        $params['created_to'] = $value . ' 23:59:59';
                        break;
                        
                    default:
                        $conditions[] = "{$field} = :{$field}";
                        $params[$field] = $value;
                }
            }
        }
        
        // Add search conditions
        if (!empty($search) && !empty($searchFields)) {
            $searchConditions = [];
            foreach ($searchFields as $field) {
                $searchConditions[] = "{$field} ILIKE :search";
            }
            
            if (!empty($searchConditions)) {
                $conditions[] = '(' . implode(' OR ', $searchConditions) . ')';
                $params['search'] = '%' . $search . '%';
            }
        }
        
        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }
        
        return ['clause' => $whereClause, 'params' => $params];
    }
    
    /**
     * Require permission for current user
     */
    protected function requirePermission($action) {
        if (!$this->currentUser) {
            sendError('Authentication required', 401);
        }
        
        $resource = $this->getResourceName();
        
        if (!hasPermission($this->currentUser['role'], $resource, $action)) {
            sendError('Insufficient permissions', 403);
        }
    }
    
    /**
     * Get resource name for permissions
     */
    protected function getResourceName() {
        $className = get_class($this);
        $resourceName = str_replace('Controller', '', $className);
        return strtolower($resourceName);
    }
    
    // Abstract methods to be implemented by child controllers
    abstract protected function getAll($pagination, $filters, $search);
    abstract protected function getOne($id);
    abstract protected function getCount($filters, $search);
    abstract protected function create($data);
    abstract protected function update($id, $data);
    abstract protected function delete($id);
    abstract protected function validateCreateData($data);
    abstract protected function validateUpdateData($data, $id);
}
?>
