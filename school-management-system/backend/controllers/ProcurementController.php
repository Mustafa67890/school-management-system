<?php
/**
 * Procurement Controller
 * Handles procurement, suppliers, purchase orders, and inventory management
 */

require_once __DIR__ . '/BaseController.php';

class ProcurementController extends BaseController {
    
    protected function getResourceName() {
        return 'procurement';
    }
    
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            $this->currentUser = getCurrentUser();
            
            // Handle procurement-specific endpoints
            switch ($resource) {
                case 'suppliers':
                    $this->handleSuppliers($method, $action);
                    break;
                    
                case 'purchase-orders':
                    $this->handlePurchaseOrders($method, $action);
                    break;
                    
                case 'goods-receiving':
                    $this->handleGoodsReceiving($method, $action);
                    break;
                    
                case 'invoices':
                    $this->handleInvoices($method, $action);
                    break;
                    
                case 'budget':
                    $this->handleBudget($method, $action);
                    break;
                    
                case 'inventory':
                    $this->handleInventory($method, $action);
                    break;
                    
                default:
                    // Default routing for general procurement endpoints
                    parent::handleRequest($method, $resource, $action);
            }
            
        } catch (Exception $e) {
            error_log("Procurement Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Handle suppliers endpoints
     */
    private function handleSuppliers($method, $action) {
        switch ($method) {
            case 'GET':
                if ($action) {
                    $this->getSupplier($action);
                } else {
                    $this->getAllSuppliers();
                }
                break;
                
            case 'POST':
                $this->createSupplier();
                break;
                
            case 'PUT':
                if ($action) {
                    $this->updateSupplier($action);
                } else {
                    sendError('Supplier ID required', 400);
                }
                break;
                
            case 'DELETE':
                if ($action) {
                    $this->deleteSupplier($action);
                } else {
                    sendError('Supplier ID required', 400);
                }
                break;
                
            default:
                sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Handle purchase orders endpoints
     */
    private function handlePurchaseOrders($method, $action) {
        switch ($method) {
            case 'GET':
                if ($action) {
                    $this->getPurchaseOrder($action);
                } else {
                    $this->getAllPurchaseOrders();
                }
                break;
                
            case 'POST':
                $this->createPurchaseOrder();
                break;
                
            case 'PUT':
                if ($action) {
                    $this->updatePurchaseOrder($action);
                } else {
                    sendError('Purchase Order ID required', 400);
                }
                break;
                
            case 'DELETE':
                if ($action) {
                    $this->deletePurchaseOrder($action);
                } else {
                    sendError('Purchase Order ID required', 400);
                }
                break;
                
            default:
                sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Get all suppliers
     */
    private function getAllSuppliers() {
        $this->requirePermission('read');
        
        $pagination = getPaginationParams();
        $search = $this->getSearchQuery();
        
        $searchFields = ['name', 'contact_person', 'phone', 'email'];
        $where = $this->buildWhereClause([], $search, $searchFields);
        
        $sql = "SELECT s.*, 
                       COUNT(po.id) as purchase_orders_count,
                       COALESCE(SUM(po.total_amount), 0) as total_orders_value
                FROM suppliers s
                LEFT JOIN purchase_orders po ON s.id = po.supplier_id
                {$where['clause']}
                GROUP BY s.id
                ORDER BY s.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        $data = $this->db->select($sql, $params);
        $total = $this->db->count('suppliers', $where['clause'], $where['params']);
        
        $response = buildPaginationResponse($data, $total, $pagination['page'], $pagination['limit']);
        sendSuccess($response);
    }
    
    /**
     * Create supplier
     */
    private function createSupplier() {
        $this->requirePermission('create');
        
        $data = getRequestBody();
        $required = ['name', 'contact_person', 'phone'];
        validateRequired($data, $required);
        
        $this->validateSupplierData($data);
        
        // Set default status
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }
        
        $supplier = $this->db->insert('suppliers', $data);
        sendSuccess($supplier, 'Supplier created successfully', 201);
    }
    
    /**
     * Get all purchase orders
     */
    private function getAllPurchaseOrders() {
        $this->requirePermission('read');
        
        $pagination = getPaginationParams();
        $filters = $this->getProcurementFilters();
        $search = $this->getSearchQuery();
        
        $where = $this->buildPurchaseOrdersWhere($filters, $search);
        
        $sql = "SELECT po.*, s.name as supplier_name, s.contact_person,
                       u.full_name as created_by_name,
                       COUNT(poi.id) as items_count
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                LEFT JOIN users u ON po.created_by = u.id
                LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
                {$where['clause']}
                GROUP BY po.id, s.name, s.contact_person, u.full_name
                ORDER BY po.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        $data = $this->db->select($sql, $params);
        
        // Get total count
        $countSql = "SELECT COUNT(DISTINCT po.id) as count
                     FROM purchase_orders po
                     JOIN suppliers s ON po.supplier_id = s.id
                     {$where['clause']}";
        
        $totalResult = $this->db->selectOne($countSql, $where['params']);
        $total = $totalResult['count'];
        
        $response = buildPaginationResponse($data, $total, $pagination['page'], $pagination['limit']);
        sendSuccess($response);
    }
    
    /**
     * Get single purchase order with items
     */
    private function getPurchaseOrder($id) {
        $this->requirePermission('read');
        
        $purchaseOrder = $this->db->selectOne(
            "SELECT po.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone,
                    s.email as supplier_email, s.address as supplier_address,
                    u.full_name as created_by_name
             FROM purchase_orders po
             JOIN suppliers s ON po.supplier_id = s.id
             LEFT JOIN users u ON po.created_by = u.id
             WHERE po.id = :id",
            ['id' => $id]
        );
        
        if (!$purchaseOrder) {
            sendError('Purchase order not found', 404);
        }
        
        // Get purchase order items
        $items = $this->db->select(
            "SELECT poi.*, ii.name as item_name, ii.unit
             FROM purchase_order_items poi
             LEFT JOIN inventory_items ii ON poi.item_id = ii.id
             WHERE poi.purchase_order_id = :purchase_order_id
             ORDER BY poi.created_at",
            ['purchase_order_id' => $id]
        );
        
        $purchaseOrder['items'] = $items;
        $purchaseOrder['items_count'] = count($items);
        
        sendSuccess($purchaseOrder);
    }
    
    /**
     * Create purchase order
     */
    private function createPurchaseOrder() {
        $this->requirePermission('create');
        
        $data = getRequestBody();
        $required = ['supplier_id', 'order_date', 'items'];
        validateRequired($data, $required);
        
        $this->validatePurchaseOrderData($data);
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Generate PO number
            $data['po_number'] = $this->generatePONumber();
            
            // Set defaults
            $data['status'] = 'pending';
            $data['created_by'] = $this->currentUser['id'];
            
            // Calculate total amount from items
            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }
            $data['total_amount'] = $totalAmount;
            
            // Remove items from main data
            $items = $data['items'];
            unset($data['items']);
            
            // Create purchase order
            $purchaseOrder = $this->db->insert('purchase_orders', $data);
            
            // Create purchase order items
            foreach ($items as $item) {
                $itemData = [
                    'purchase_order_id' => $purchaseOrder['id'],
                    'item_id' => $item['item_id'] ?? null,
                    'item_description' => $item['item_description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price']
                ];
                
                $this->db->insert('purchase_order_items', $itemData);
            }
            
            $this->db->commit();
            
            // Get complete purchase order
            $completePO = $this->getPurchaseOrderById($purchaseOrder['id']);
            
            sendSuccess($completePO, 'Purchase order created successfully', 201);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    /**
     * Get procurement statistics
     */
    public function getStats($resource) {
        $this->requirePermission('read');
        
        $currentYear = date('Y');
        
        $stats = [
            'total_suppliers' => $this->db->count('suppliers', "status = 'active'"),
            
            'total_purchase_orders' => $this->db->count('purchase_orders', 
                "EXTRACT(YEAR FROM order_date) = :year", 
                ['year' => $currentYear]
            ),
            
            'total_procurement_value' => $this->db->selectOne(
                "SELECT COALESCE(SUM(total_amount), 0) as total
                 FROM purchase_orders 
                 WHERE EXTRACT(YEAR FROM order_date) = :year",
                ['year' => $currentYear]
            )['total'],
            
            'by_status' => $this->db->select(
                "SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_value
                 FROM purchase_orders 
                 WHERE EXTRACT(YEAR FROM order_date) = :year
                 GROUP BY status",
                ['year' => $currentYear]
            ),
            
            'monthly_procurement' => $this->db->select(
                "SELECT EXTRACT(MONTH FROM order_date) as month,
                        COUNT(*) as orders_count,
                        COALESCE(SUM(total_amount), 0) as total_value
                 FROM purchase_orders 
                 WHERE EXTRACT(YEAR FROM order_date) = :year
                 GROUP BY EXTRACT(MONTH FROM order_date)
                 ORDER BY month",
                ['year' => $currentYear]
            ),
            
            'top_suppliers' => $this->db->select(
                "SELECT s.name, COUNT(po.id) as orders_count,
                        COALESCE(SUM(po.total_amount), 0) as total_value
                 FROM suppliers s
                 LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
                   AND EXTRACT(YEAR FROM po.order_date) = :year
                 WHERE s.status = 'active'
                 GROUP BY s.id, s.name
                 ORDER BY total_value DESC
                 LIMIT 10",
                ['year' => $currentYear]
            )
        ];
        
        sendSuccess($stats);
    }
    
    /**
     * Validate supplier data
     */
    private function validateSupplierData($data, $id = null) {
        // Validate email if provided
        if (isset($data['email']) && !empty($data['email']) && !isValidEmail($data['email'])) {
            sendError('Invalid email format', 400);
        }
        
        // Validate phone
        if (isset($data['phone']) && !isValidPhone($data['phone'])) {
            sendError('Invalid phone number format', 400);
        }
        
        // Check for duplicate supplier name
        $existingCondition = "name = :name";
        $params = ['name' => $data['name']];
        
        if ($id) {
            $existingCondition .= " AND id != :id";
            $params['id'] = $id;
        }
        
        if ($this->db->exists('suppliers', $existingCondition, $params)) {
            sendError('Supplier name already exists', 409);
        }
    }
    
    /**
     * Validate purchase order data
     */
    private function validatePurchaseOrderData($data) {
        // Check if supplier exists
        if (!$this->db->exists('suppliers', 'id = :id AND status = :status', 
            ['id' => $data['supplier_id'], 'status' => 'active'])) {
            sendError('Supplier not found or inactive', 404);
        }
        
        // Validate order date
        if (!strtotime($data['order_date'])) {
            sendError('Invalid order date format', 400);
        }
        
        // Validate items
        if (empty($data['items']) || !is_array($data['items'])) {
            sendError('At least one item is required', 400);
        }
        
        foreach ($data['items'] as $index => $item) {
            if (empty($item['item_description'])) {
                sendError("Item description is required for item " . ($index + 1), 400);
            }
            
            if (!isset($item['quantity']) || !is_numeric($item['quantity']) || $item['quantity'] <= 0) {
                sendError("Valid quantity is required for item " . ($index + 1), 400);
            }
            
            if (!isset($item['unit_price']) || !is_numeric($item['unit_price']) || $item['unit_price'] <= 0) {
                sendError("Valid unit price is required for item " . ($index + 1), 400);
            }
        }
    }
    
    /**
     * Generate unique PO number
     */
    private function generatePONumber() {
        $year = date('Y');
        $month = date('m');
        $prefix = "PO-{$year}{$month}-";
        
        // Get the last PO number for this month
        $lastPO = $this->db->selectOne(
            "SELECT po_number FROM purchase_orders 
             WHERE po_number LIKE :prefix 
             ORDER BY created_at DESC 
             LIMIT 1",
            ['prefix' => $prefix . '%']
        );
        
        if ($lastPO) {
            $lastNumber = intval(substr($lastPO['po_number'], -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
    
    /**
     * Get purchase order by ID (internal method)
     */
    private function getPurchaseOrderById($id) {
        return $this->db->selectOne(
            "SELECT po.*, s.name as supplier_name
             FROM purchase_orders po
             JOIN suppliers s ON po.supplier_id = s.id
             WHERE po.id = :id",
            ['id' => $id]
        );
    }
    
    /**
     * Get procurement-specific filters
     */
    private function getProcurementFilters() {
        $filters = [];
        
        if (isset($_GET['supplier_id'])) {
            $filters['supplier_id'] = $_GET['supplier_id'];
        }
        
        if (isset($_GET['status'])) {
            $filters['status'] = $_GET['status'];
        }
        
        if (isset($_GET['order_from'])) {
            $filters['order_from'] = $_GET['order_from'];
        }
        
        if (isset($_GET['order_to'])) {
            $filters['order_to'] = $_GET['order_to'];
        }
        
        return $filters;
    }
    
    /**
     * Build WHERE clause for purchase orders
     */
    private function buildPurchaseOrdersWhere($filters, $search) {
        $conditions = [];
        $params = [];
        
        // Add filter conditions
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                switch ($field) {
                    case 'supplier_id':
                        $conditions[] = "po.supplier_id = :supplier_id";
                        $params['supplier_id'] = $value;
                        break;
                        
                    case 'status':
                        $conditions[] = "po.status = :status";
                        $params['status'] = $value;
                        break;
                        
                    case 'order_from':
                        $conditions[] = "po.order_date >= :order_from";
                        $params['order_from'] = $value;
                        break;
                        
                    case 'order_to':
                        $conditions[] = "po.order_date <= :order_to";
                        $params['order_to'] = $value;
                        break;
                }
            }
        }
        
        // Add search conditions
        if (!empty($search)) {
            $conditions[] = "(po.po_number ILIKE :search OR s.name ILIKE :search OR po.description ILIKE :search)";
            $params['search'] = '%' . $search . '%';
        }
        
        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }
        
        return ['clause' => $whereClause, 'params' => $params];
    }
    
    // Placeholder methods for other procurement modules
    private function handleGoodsReceiving($method, $action) {
        sendError('Goods receiving module not implemented yet', 501);
    }
    
    private function handleInvoices($method, $action) {
        sendError('Invoices module not implemented yet', 501);
    }
    
    private function handleBudget($method, $action) {
        sendError('Budget module not implemented yet', 501);
    }
    
    private function handleInventory($method, $action) {
        sendError('Inventory module not implemented yet', 501);
    }
    
    // Required by BaseController but handled differently in this controller
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
