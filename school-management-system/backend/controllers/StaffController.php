<?php
/**
 * Staff Controller
 * Handles staff management operations
 */

require_once __DIR__ . '/BaseController.php';

class StaffController extends BaseController {
    
    protected function getResourceName() {
        return 'staff';
    }
    
    /**
     * Get all staff with pagination and filters
     */
    protected function getAll($pagination, $filters, $search) {
        $searchFields = ['full_name', 'staff_number', 'position', 'department', 'phone', 'email'];
        $where = $this->buildWhereClause($filters, $search, $searchFields);
        
        $sql = "SELECT s.*, 
                       EXTRACT(YEAR FROM AGE(s.date_of_birth)) as age,
                       EXTRACT(YEAR FROM AGE(s.employment_date)) as years_of_service
                FROM staff s
                {$where['clause']}
                ORDER BY s.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        return $this->db->select($sql, $params);
    }
    
    /**
     * Get single staff member with related data
     */
    protected function getOne($id) {
        $staff = $this->db->selectOne(
            "SELECT s.*, 
                    EXTRACT(YEAR FROM AGE(s.date_of_birth)) as age,
                    EXTRACT(YEAR FROM AGE(s.employment_date)) as years_of_service
             FROM staff s 
             WHERE s.id = :id",
            ['id' => $id]
        );
        
        if (!$staff) {
            return null;
        }
        
        // Get recent payroll entries
        $payrollEntries = $this->db->select(
            "SELECT pe.*, pr.pay_period_start, pr.pay_period_end, pr.status as payroll_status
             FROM payroll_entries pe
             JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
             WHERE pe.staff_id = :staff_id
             ORDER BY pr.pay_period_end DESC
             LIMIT 6",
            ['staff_id' => $id]
        );
        
        $staff['recent_payroll'] = $payrollEntries;
        $staff['total_earnings_ytd'] = array_sum(array_column($payrollEntries, 'net_pay'));
        
        return $staff;
    }
    
    /**
     * Get count of staff
     */
    protected function getCount($filters, $search) {
        $searchFields = ['full_name', 'staff_number', 'position', 'department', 'phone', 'email'];
        $where = $this->buildWhereClause($filters, $search, $searchFields);
        
        return $this->db->count('staff', $where['clause'], $where['params']);
    }
    
    /**
     * Create new staff member
     */
    protected function create($data) {
        // Generate staff number if not provided
        if (!isset($data['staff_number']) || empty($data['staff_number'])) {
            $data['staff_number'] = $this->generateStaffNumber();
        }
        
        // Set default status
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }
        
        // Set employment date if not provided
        if (!isset($data['employment_date'])) {
            $data['employment_date'] = date('Y-m-d');
        }
        
        return $this->db->insert('staff', $data);
    }
    
    /**
     * Update staff member
     */
    protected function update($id, $data) {
        // Check if staff exists
        $existing = $this->db->selectOne("SELECT id FROM staff WHERE id = :id", ['id' => $id]);
        
        if (!$existing) {
            return null;
        }
        
        return $this->db->update('staff', $data, 'id = :id', ['id' => $id]);
    }
    
    /**
     * Delete staff member (soft delete by setting status to inactive)
     */
    protected function delete($id) {
        return $this->db->update('staff', 
            ['status' => 'inactive'], 
            'id = :id', 
            ['id' => $id]
        );
    }
    
    /**
     * Validate create data
     */
    protected function validateCreateData($data) {
        $required = ['full_name', 'position', 'department', 'basic_salary'];
        validateRequired($data, $required);
        
        $this->validateStaffData($data);
    }
    
    /**
     * Validate update data
     */
    protected function validateUpdateData($data, $id) {
        $this->validateStaffData($data, $id);
    }
    
    /**
     * Validate staff data
     */
    private function validateStaffData($data, $id = null) {
        // Validate staff number uniqueness if provided
        if (isset($data['staff_number'])) {
            $existingCondition = "staff_number = :staff_number";
            $params = ['staff_number' => $data['staff_number']];
            
            if ($id) {
                $existingCondition .= " AND id != :id";
                $params['id'] = $id;
            }
            
            if ($this->db->exists('staff', $existingCondition, $params)) {
                sendError('Staff number already exists', 409);
            }
        }
        
        // Validate gender
        if (isset($data['gender']) && !in_array($data['gender'], ['Male', 'Female'])) {
            sendError('Gender must be Male or Female', 400);
        }
        
        // Validate email if provided
        if (isset($data['email']) && !empty($data['email']) && !isValidEmail($data['email'])) {
            sendError('Invalid email format', 400);
        }
        
        // Validate phone if provided
        if (isset($data['phone']) && !empty($data['phone']) && !isValidPhone($data['phone'])) {
            sendError('Invalid phone number format', 400);
        }
        
        // Validate salary amounts
        $salaryFields = ['basic_salary', 'house_allowance', 'transport_allowance', 'other_allowances'];
        foreach ($salaryFields as $field) {
            if (isset($data[$field]) && (!is_numeric($data[$field]) || $data[$field] < 0)) {
                sendError("$field must be a non-negative number", 400);
            }
        }
        
        // Validate date of birth
        if (isset($data['date_of_birth']) && !empty($data['date_of_birth'])) {
            $dob = strtotime($data['date_of_birth']);
            if (!$dob || $dob > time()) {
                sendError('Invalid date of birth', 400);
            }
        }
        
        // Validate employment date
        if (isset($data['employment_date']) && !empty($data['employment_date'])) {
            $empDate = strtotime($data['employment_date']);
            if (!$empDate) {
                sendError('Invalid employment date format', 400);
            }
        }
        
        // Validate status
        if (isset($data['status'])) {
            $validStatuses = ['active', 'inactive', 'suspended', 'terminated'];
            if (!in_array($data['status'], $validStatuses)) {
                sendError('Invalid status', 400);
            }
        }
        
        // Validate employment type
        if (isset($data['employment_type'])) {
            $validTypes = ['permanent', 'contract', 'temporary', 'part_time'];
            if (!in_array($data['employment_type'], $validTypes)) {
                sendError('Invalid employment type', 400);
            }
        }
    }
    
    /**
     * Generate unique staff number
     */
    private function generateStaffNumber() {
        do {
            $staffNumber = generateStaffNumber();
        } while ($this->db->exists('staff', 'staff_number = :staff_number', ['staff_number' => $staffNumber]));
        
        return $staffNumber;
    }
    
    /**
     * Get staff by department
     */
    public function getByDepartment($department) {
        $this->requirePermission('read');
        
        $staff = $this->db->select(
            "SELECT * FROM staff WHERE department = :department AND status = 'active' ORDER BY full_name",
            ['department' => $department]
        );
        
        sendSuccess($staff);
    }
    
    /**
     * Get staff statistics
     */
    public function getStats($resource) {
        $this->requirePermission('read');
        
        $stats = [
            'total_staff' => $this->db->count('staff', "status = 'active'"),
            'by_department' => $this->db->select(
                "SELECT department, COUNT(*) as count 
                 FROM staff 
                 WHERE status = 'active' 
                 GROUP BY department 
                 ORDER BY count DESC"
            ),
            'by_employment_type' => $this->db->select(
                "SELECT employment_type, COUNT(*) as count 
                 FROM staff 
                 WHERE status = 'active' 
                 GROUP BY employment_type"
            ),
            'by_gender' => $this->db->select(
                "SELECT gender, COUNT(*) as count 
                 FROM staff 
                 WHERE status = 'active' 
                 GROUP BY gender"
            ),
            'recent_hires' => $this->db->count('staff', 
                "employment_date >= :date AND status = 'active'", 
                ['date' => date('Y-m-d', strtotime('-30 days'))]
            ),
            'average_salary' => $this->db->selectOne(
                "SELECT AVG(basic_salary + COALESCE(house_allowance, 0) + COALESCE(transport_allowance, 0) + COALESCE(other_allowances, 0)) as avg_salary
                 FROM staff 
                 WHERE status = 'active'"
            )['avg_salary']
        ];
        
        sendSuccess($stats);
    }
    
    /**
     * Export staff to CSV
     */
    public function getExport($resource) {
        $this->requirePermission('read');
        
        $staff = $this->db->select(
            "SELECT staff_number, full_name, position, department, gender, date_of_birth, phone, email,
                    basic_salary, house_allowance, transport_allowance, other_allowances, employment_date, employment_type, status
             FROM staff 
             ORDER BY department, full_name"
        );
        
        if (empty($staff)) {
            sendError('No staff found for export', 404);
        }
        
        arrayToCsv($staff, 'staff_export_' . date('Y-m-d') . '.csv');
    }
    
    /**
     * Get staff payroll summary
     */
    public function getPayrollSummary($staffId) {
        $this->requirePermission('read');
        
        // Get staff basic info
        $staff = $this->db->selectOne(
            "SELECT id, full_name, staff_number, position, basic_salary, house_allowance, transport_allowance, other_allowances
             FROM staff WHERE id = :id",
            ['id' => $staffId]
        );
        
        if (!$staff) {
            sendError('Staff member not found', 404);
        }
        
        // Get payroll history
        $payrollHistory = $this->db->select(
            "SELECT pe.*, pr.pay_period_start, pr.pay_period_end, pr.status as payroll_status
             FROM payroll_entries pe
             JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
             WHERE pe.staff_id = :staff_id
             ORDER BY pr.pay_period_end DESC
             LIMIT 12",
            ['staff_id' => $staffId]
        );
        
        // Calculate totals
        $totalGross = array_sum(array_column($payrollHistory, 'gross_pay'));
        $totalDeductions = array_sum(array_column($payrollHistory, 'total_deductions'));
        $totalNet = array_sum(array_column($payrollHistory, 'net_pay'));
        
        sendSuccess([
            'staff' => $staff,
            'payroll_history' => $payrollHistory,
            'summary' => [
                'total_gross_pay' => $totalGross,
                'total_deductions' => $totalDeductions,
                'total_net_pay' => $totalNet,
                'average_monthly_net' => count($payrollHistory) > 0 ? $totalNet / count($payrollHistory) : 0
            ]
        ]);
    }
    
    /**
     * Bulk import staff
     */
    public function postImport($resource) {
        $this->requirePermission('create');
        
        if (!isset($_FILES['file'])) {
            sendError('No file uploaded', 400);
        }
        
        $file = $_FILES['file'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendError('File upload failed', 400);
        }
        
        // Validate file type
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($fileExtension, ['csv', 'xlsx'])) {
            sendError('Only CSV and Excel files are allowed', 400);
        }
        
        // Process CSV file
        if ($fileExtension === 'csv') {
            $imported = $this->importFromCsv($file['tmp_name']);
        } else {
            sendError('Excel import not implemented yet', 501);
        }
        
        sendSuccess([
            'imported_count' => $imported,
            'message' => "Successfully imported {$imported} staff members"
        ]);
    }
    
    /**
     * Import staff from CSV
     */
    private function importFromCsv($filePath) {
        $imported = 0;
        $errors = [];
        
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            $header = fgetcsv($handle);
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                try {
                    $staffData = array_combine($header, $data);
                    
                    // Generate staff number if not provided
                    if (empty($staffData['staff_number'])) {
                        $staffData['staff_number'] = $this->generateStaffNumber();
                    }
                    
                    $this->validateCreateData($staffData);
                    $this->create($staffData);
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Row " . ($imported + 1) . ": " . $e->getMessage();
                }
            }
            
            fclose($handle);
        }
        
        if (!empty($errors)) {
            logMessage("Staff import errors: " . implode(', ', $errors), 'WARNING');
        }
        
        return $imported;
    }
    
    /**
     * Get staff performance metrics
     */
    public function getPerformance($staffId) {
        $this->requirePermission('read');
        
        // This would typically integrate with a performance management system
        // For now, return basic employment metrics
        
        $staff = $this->db->selectOne(
            "SELECT id, full_name, staff_number, position, employment_date
             FROM staff WHERE id = :id",
            ['id' => $staffId]
        );
        
        if (!$staff) {
            sendError('Staff member not found', 404);
        }
        
        $performance = [
            'staff' => $staff,
            'employment_duration' => [
                'years' => floor((time() - strtotime($staff['employment_date'])) / (365 * 24 * 60 * 60)),
                'months' => floor((time() - strtotime($staff['employment_date'])) / (30 * 24 * 60 * 60))
            ],
            'attendance' => [
                'note' => 'Attendance tracking not implemented yet'
            ],
            'training' => [
                'note' => 'Training records not implemented yet'
            ]
        ];
        
        sendSuccess($performance);
    }
}
?>
