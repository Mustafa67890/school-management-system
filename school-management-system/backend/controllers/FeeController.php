<?php
/**
 * Fee Controller
 * Handles fee structure and payment operations
 */

require_once __DIR__ . '/BaseController.php';

class FeeController extends BaseController {
    
    protected function getResourceName() {
        return 'fees';
    }
    
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            $this->currentUser = getCurrentUser();
            
            // Handle fee-specific endpoints
            if ($resource === 'structure') {
                $this->handleFeeStructure($method, $action);
            } elseif ($resource === 'payments') {
                $this->handlePayments($method, $action);
            } elseif ($resource && $action === 'payments') {
                $this->handleStudentPayments($method, $resource);
            } else {
                // Default routing
                parent::handleRequest($method, $resource, $action);
            }
            
        } catch (Exception $e) {
            error_log("Fee Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Handle fee structure endpoints
     */
    private function handleFeeStructure($method, $action) {
        switch ($method) {
            case 'GET':
                if ($action) {
                    $this->getFeeStructureAction($action);
                } else {
                    $this->getAllFeeStructures();
                }
                break;
                
            case 'POST':
                $this->createFeeStructure();
                break;
                
            case 'PUT':
                if ($action) {
                    $this->updateFeeStructure($action);
                } else {
                    sendError('Fee structure ID required', 400);
                }
                break;
                
            case 'DELETE':
                if ($action) {
                    $this->deleteFeeStructure($action);
                } else {
                    sendError('Fee structure ID required', 400);
                }
                break;
                
            default:
                sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Handle payment endpoints
     */
    private function handlePayments($method, $action) {
        switch ($method) {
            case 'GET':
                if ($action) {
                    $this->getPayment($action);
                } else {
                    $this->getAllPayments();
                }
                break;
                
            case 'POST':
                $this->createPayment();
                break;
                
            case 'PUT':
                if ($action) {
                    $this->updatePayment($action);
                } else {
                    sendError('Payment ID required', 400);
                }
                break;
                
            case 'DELETE':
                if ($action) {
                    $this->deletePayment($action);
                } else {
                    sendError('Payment ID required', 400);
                }
                break;
                
            default:
                sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Handle student-specific payments
     */
    private function handleStudentPayments($method, $studentId) {
        if ($method === 'GET') {
            $this->getStudentPayments($studentId);
        } else {
            sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Get all fee structures
     */
    private function getAllFeeStructures() {
        $this->requirePermission('read');
        
        $pagination = getPaginationParams();
        $filters = $this->getFeeFilters();
        
        $where = $this->buildFeeStructureWhere($filters);
        
        $sql = "SELECT * FROM fee_structure 
                {$where['clause']}
                ORDER BY academic_year DESC, term, class_form, fee_type
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        $data = $this->db->select($sql, $params);
        $total = $this->db->count('fee_structure', $where['clause'], $where['params']);
        
        $response = buildPaginationResponse($data, $total, $pagination['page'], $pagination['limit']);
        sendSuccess($response);
    }
    
    /**
     * Create fee structure
     */
    private function createFeeStructure() {
        $this->requirePermission('create');
        
        $data = getRequestBody();
        $required = ['class_form', 'fee_type', 'amount', 'academic_year', 'term'];
        validateRequired($data, $required);
        
        $this->validateFeeStructureData($data);
        
        // Check for duplicate fee structure
        if ($this->db->exists('fee_structure', 
            'class_form = :class_form AND fee_type = :fee_type AND academic_year = :academic_year AND term = :term',
            [
                'class_form' => $data['class_form'],
                'fee_type' => $data['fee_type'],
                'academic_year' => $data['academic_year'],
                'term' => $data['term']
            ]
        )) {
            sendError('Fee structure already exists for this class, type, year and term', 409);
        }
        
        $feeStructure = $this->db->insert('fee_structure', $data);
        sendSuccess($feeStructure, 'Fee structure created successfully', 201);
    }
    
    /**
     * Update fee structure
     */
    private function updateFeeStructure($id) {
        $this->requirePermission('update');
        
        $data = getRequestBody();
        $this->validateFeeStructureData($data, $id);
        
        $feeStructure = $this->db->update('fee_structure', $data, 'id = :id', ['id' => $id]);
        
        if (!$feeStructure) {
            sendError('Fee structure not found', 404);
        }
        
        sendSuccess($feeStructure, 'Fee structure updated successfully');
    }
    
    /**
     * Delete fee structure
     */
    private function deleteFeeStructure($id) {
        $this->requirePermission('delete');
        
        // Check if there are payments linked to this fee structure
        if ($this->db->exists('student_payments', 'fee_structure_id = :id', ['id' => $id])) {
            sendError('Cannot delete fee structure with existing payments', 409);
        }
        
        $feeStructure = $this->db->delete('fee_structure', 'id = :id', ['id' => $id]);
        
        if (!$feeStructure) {
            sendError('Fee structure not found', 404);
        }
        
        sendSuccess(null, 'Fee structure deleted successfully');
    }
    
    /**
     * Get all payments
     */
    private function getAllPayments() {
        $this->requirePermission('read');
        
        $pagination = getPaginationParams();
        $filters = $this->getPaymentFilters();
        $search = $this->getSearchQuery();
        
        $where = $this->buildPaymentWhere($filters, $search);
        
        $sql = "SELECT sp.*, s.full_name as student_name, s.student_id, s.class_form,
                       fs.fee_type, fs.amount as fee_amount,
                       u.full_name as recorded_by
                FROM student_payments sp
                JOIN students s ON sp.student_id = s.id
                JOIN fee_structure fs ON sp.fee_structure_id = fs.id
                LEFT JOIN users u ON sp.recorded_by = u.id
                {$where['clause']}
                ORDER BY sp.payment_date DESC, sp.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        $data = $this->db->select($sql, $params);
        
        // Get total count
        $countSql = "SELECT COUNT(*) as count
                     FROM student_payments sp
                     JOIN students s ON sp.student_id = s.id
                     JOIN fee_structure fs ON sp.fee_structure_id = fs.id
                     {$where['clause']}";
        
        $totalResult = $this->db->selectOne($countSql, $where['params']);
        $total = $totalResult['count'];
        
        $response = buildPaginationResponse($data, $total, $pagination['page'], $pagination['limit']);
        sendSuccess($response);
    }
    
    /**
     * Create payment
     */
    private function createPayment() {
        $this->requirePermission('create');
        
        $data = getRequestBody();
        $required = ['student_id', 'fee_structure_id', 'amount', 'payment_method'];
        validateRequired($data, $required);
        
        $this->validatePaymentData($data);
        
        // Set payment date if not provided
        if (!isset($data['payment_date'])) {
            $data['payment_date'] = date('Y-m-d');
        }
        
        // Generate receipt number
        $data['receipt_number'] = $this->generateReceiptNumber();
        
        // Set recorded by
        $data['recorded_by'] = $this->currentUser['id'];
        
        $payment = $this->db->insert('student_payments', $data);
        
        // Get payment with related data
        $paymentWithDetails = $this->db->selectOne(
            "SELECT sp.*, s.full_name as student_name, s.student_id, s.class_form,
                    fs.fee_type, fs.amount as fee_amount
             FROM student_payments sp
             JOIN students s ON sp.student_id = s.id
             JOIN fee_structure fs ON sp.fee_structure_id = fs.id
             WHERE sp.id = :id",
            ['id' => $payment['id']]
        );
        
        sendSuccess($paymentWithDetails, 'Payment recorded successfully', 201);
    }
    
    /**
     * Get student payments
     */
    private function getStudentPayments($studentId) {
        $this->requirePermission('read');
        
        $payments = $this->db->select(
            "SELECT sp.*, fs.fee_type, fs.amount as fee_amount, fs.academic_year, fs.term,
                    u.full_name as recorded_by_name
             FROM student_payments sp
             JOIN fee_structure fs ON sp.fee_structure_id = fs.id
             LEFT JOIN users u ON sp.recorded_by = u.id
             WHERE sp.student_id = :student_id
             ORDER BY sp.payment_date DESC",
            ['student_id' => $studentId]
        );
        
        // Get outstanding fees for this student
        $student = $this->db->selectOne("SELECT class_form FROM students WHERE id = :id", ['id' => $studentId]);
        
        if ($student) {
            $outstandingFees = $this->db->select(
                "SELECT fs.*, 
                        COALESCE(SUM(sp.amount), 0) as paid_amount,
                        (fs.amount - COALESCE(SUM(sp.amount), 0)) as outstanding_amount
                 FROM fee_structure fs
                 LEFT JOIN student_payments sp ON fs.id = sp.fee_structure_id AND sp.student_id = :student_id
                 WHERE fs.class_form = :class_form 
                   AND fs.academic_year = :academic_year
                 GROUP BY fs.id
                 HAVING (fs.amount - COALESCE(SUM(sp.amount), 0)) > 0",
                [
                    'student_id' => $studentId,
                    'class_form' => $student['class_form'],
                    'academic_year' => CURRENT_ACADEMIC_YEAR
                ]
            );
        } else {
            $outstandingFees = [];
        }
        
        sendSuccess([
            'payments' => $payments,
            'outstanding_fees' => $outstandingFees,
            'total_paid' => array_sum(array_column($payments, 'amount')),
            'total_outstanding' => array_sum(array_column($outstandingFees, 'outstanding_amount'))
        ]);
    }
    
    /**
     * Get fee statistics
     */
    public function getStats($resource) {
        $this->requirePermission('read');
        
        $currentYear = CURRENT_ACADEMIC_YEAR;
        
        $stats = [
            'total_collections' => $this->db->selectOne(
                "SELECT COALESCE(SUM(amount), 0) as total FROM student_payments 
                 WHERE EXTRACT(YEAR FROM payment_date) = :year",
                ['year' => $currentYear]
            )['total'],
            
            'monthly_collections' => $this->db->select(
                "SELECT EXTRACT(MONTH FROM payment_date) as month,
                        COALESCE(SUM(amount), 0) as total
                 FROM student_payments 
                 WHERE EXTRACT(YEAR FROM payment_date) = :year
                 GROUP BY EXTRACT(MONTH FROM payment_date)
                 ORDER BY month",
                ['year' => $currentYear]
            ),
            
            'by_fee_type' => $this->db->select(
                "SELECT fs.fee_type, COALESCE(SUM(sp.amount), 0) as total
                 FROM fee_structure fs
                 LEFT JOIN student_payments sp ON fs.id = sp.fee_structure_id
                 WHERE fs.academic_year = :year
                 GROUP BY fs.fee_type
                 ORDER BY total DESC",
                ['year' => $currentYear]
            ),
            
            'outstanding_by_class' => $this->db->select(
                "SELECT fs.class_form,
                        SUM(fs.amount) as total_fees,
                        COALESCE(SUM(sp.amount), 0) as total_paid,
                        (SUM(fs.amount) - COALESCE(SUM(sp.amount), 0)) as outstanding
                 FROM fee_structure fs
                 LEFT JOIN student_payments sp ON fs.id = sp.fee_structure_id
                 WHERE fs.academic_year = :year
                 GROUP BY fs.class_form
                 ORDER BY fs.class_form",
                ['year' => $currentYear]
            )
        ];
        
        sendSuccess($stats);
    }
    
    /**
     * Validate fee structure data
     */
    private function validateFeeStructureData($data, $id = null) {
        // Validate class form
        $validClasses = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
        if (isset($data['class_form']) && !in_array($data['class_form'], $validClasses)) {
            sendError('Invalid class form', 400);
        }
        
        // Validate amount
        if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] <= 0)) {
            sendError('Amount must be a positive number', 400);
        }
        
        // Validate academic year
        if (isset($data['academic_year']) && !preg_match('/^\d{4}$/', $data['academic_year'])) {
            sendError('Invalid academic year format', 400);
        }
        
        // Validate term
        if (isset($data['term']) && !in_array($data['term'], ['Term 1', 'Term 2', 'Term 3'])) {
            sendError('Invalid term', 400);
        }
    }
    
    /**
     * Validate payment data
     */
    private function validatePaymentData($data) {
        // Check if student exists
        if (!$this->db->exists('students', 'id = :id AND status = :status', 
            ['id' => $data['student_id'], 'status' => 'active'])) {
            sendError('Student not found or inactive', 404);
        }
        
        // Check if fee structure exists
        if (!$this->db->exists('fee_structure', 'id = :id', ['id' => $data['fee_structure_id']])) {
            sendError('Fee structure not found', 404);
        }
        
        // Validate amount
        if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
            sendError('Amount must be a positive number', 400);
        }
        
        // Validate payment method
        $validMethods = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque'];
        if (!in_array($data['payment_method'], $validMethods)) {
            sendError('Invalid payment method', 400);
        }
        
        // Validate payment date if provided
        if (isset($data['payment_date']) && !strtotime($data['payment_date'])) {
            sendError('Invalid payment date format', 400);
        }
    }
    
    /**
     * Generate unique receipt number
     */
    private function generateReceiptNumber() {
        do {
            $receiptNumber = generateReceiptNumber();
        } while ($this->db->exists('student_payments', 'receipt_number = :receipt_number', 
            ['receipt_number' => $receiptNumber]));
        
        return $receiptNumber;
    }
    
    /**
     * Get fee-specific filters
     */
    private function getFeeFilters() {
        $filters = [];
        
        if (isset($_GET['class_form'])) {
            $filters['class_form'] = $_GET['class_form'];
        }
        
        if (isset($_GET['academic_year'])) {
            $filters['academic_year'] = $_GET['academic_year'];
        }
        
        if (isset($_GET['term'])) {
            $filters['term'] = $_GET['term'];
        }
        
        if (isset($_GET['fee_type'])) {
            $filters['fee_type'] = $_GET['fee_type'];
        }
        
        return $filters;
    }
    
    /**
     * Get payment-specific filters
     */
    private function getPaymentFilters() {
        $filters = [];
        
        if (isset($_GET['student_id'])) {
            $filters['student_id'] = $_GET['student_id'];
        }
        
        if (isset($_GET['payment_method'])) {
            $filters['payment_method'] = $_GET['payment_method'];
        }
        
        if (isset($_GET['payment_from'])) {
            $filters['payment_from'] = $_GET['payment_from'];
        }
        
        if (isset($_GET['payment_to'])) {
            $filters['payment_to'] = $_GET['payment_to'];
        }
        
        return $filters;
    }
    
    /**
     * Build WHERE clause for fee structure
     */
    private function buildFeeStructureWhere($filters) {
        $conditions = [];
        $params = [];
        
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                $conditions[] = "{$field} = :{$field}";
                $params[$field] = $value;
            }
        }
        
        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }
        
        return ['clause' => $whereClause, 'params' => $params];
    }
    
    /**
     * Build WHERE clause for payments
     */
    private function buildPaymentWhere($filters, $search) {
        $conditions = [];
        $params = [];
        
        // Add filter conditions
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                switch ($field) {
                    case 'payment_from':
                        $conditions[] = "sp.payment_date >= :payment_from";
                        $params['payment_from'] = $value;
                        break;
                        
                    case 'payment_to':
                        $conditions[] = "sp.payment_date <= :payment_to";
                        $params['payment_to'] = $value;
                        break;
                        
                    case 'student_id':
                        $conditions[] = "sp.student_id = :student_id";
                        $params['student_id'] = $value;
                        break;
                        
                    case 'payment_method':
                        $conditions[] = "sp.payment_method = :payment_method";
                        $params['payment_method'] = $value;
                        break;
                }
            }
        }
        
        // Add search conditions
        if (!empty($search)) {
            $conditions[] = "(s.full_name ILIKE :search OR s.student_id ILIKE :search OR sp.receipt_number ILIKE :search)";
            $params['search'] = '%' . $search . '%';
        }
        
        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = 'WHERE ' . implode(' AND ', $conditions);
        }
        
        return ['clause' => $whereClause, 'params' => $params];
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
