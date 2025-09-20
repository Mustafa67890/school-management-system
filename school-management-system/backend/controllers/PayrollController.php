<?php
/**
 * Payroll Controller
 * Handles payroll runs and salary calculations
 */

require_once __DIR__ . '/BaseController.php';

class PayrollController extends BaseController {
    
    protected function getResourceName() {
        return 'payroll';
    }
    
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            $this->currentUser = getCurrentUser();
            
            // Handle payroll-specific endpoints
            if ($resource === 'runs') {
                $this->handlePayrollRuns($method, $action);
            } elseif ($resource === 'entries') {
                $this->handlePayrollEntries($method, $action);
            } elseif ($resource && $action === 'calculate') {
                $this->calculatePayroll($resource);
            } elseif ($resource && $action === 'approve') {
                $this->approvePayroll($resource);
            } elseif ($resource && $action === 'payslip') {
                $this->generatePayslip($resource, $_GET['staff_id'] ?? null);
            } else {
                // Default routing
                parent::handleRequest($method, $resource, $action);
            }
            
        } catch (Exception $e) {
            error_log("Payroll Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Handle payroll runs endpoints
     */
    private function handlePayrollRuns($method, $action) {
        switch ($method) {
            case 'GET':
                if ($action) {
                    $this->getPayrollRun($action);
                } else {
                    $this->getAllPayrollRuns();
                }
                break;
                
            case 'POST':
                $this->createPayrollRun();
                break;
                
            case 'PUT':
                if ($action) {
                    $this->updatePayrollRun($action);
                } else {
                    sendError('Payroll run ID required', 400);
                }
                break;
                
            case 'DELETE':
                if ($action) {
                    $this->deletePayrollRun($action);
                } else {
                    sendError('Payroll run ID required', 400);
                }
                break;
                
            default:
                sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Handle payroll entries endpoints
     */
    private function handlePayrollEntries($method, $action) {
        switch ($method) {
            case 'GET':
                if ($action) {
                    $this->getPayrollEntry($action);
                } else {
                    $this->getAllPayrollEntries();
                }
                break;
                
            case 'PUT':
                if ($action) {
                    $this->updatePayrollEntry($action);
                } else {
                    sendError('Payroll entry ID required', 400);
                }
                break;
                
            default:
                sendError('Method not allowed', 405);
        }
    }
    
    /**
     * Get all payroll runs
     */
    private function getAllPayrollRuns() {
        $this->requirePermission('read');
        
        $pagination = getPaginationParams();
        $filters = $this->getPayrollFilters();
        
        $where = $this->buildPayrollRunsWhere($filters);
        
        $sql = "SELECT pr.*, 
                       COUNT(pe.id) as staff_count,
                       COALESCE(SUM(pe.gross_pay), 0) as total_gross,
                       COALESCE(SUM(pe.net_pay), 0) as total_net,
                       u.full_name as created_by_name
                FROM payroll_runs pr
                LEFT JOIN payroll_entries pe ON pr.id = pe.payroll_run_id
                LEFT JOIN users u ON pr.created_by = u.id
                {$where['clause']}
                GROUP BY pr.id, u.full_name
                ORDER BY pr.pay_period_end DESC
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        $data = $this->db->select($sql, $params);
        $total = $this->db->count('payroll_runs', $where['clause'], $where['params']);
        
        $response = buildPaginationResponse($data, $total, $pagination['page'], $pagination['limit']);
        sendSuccess($response);
    }
    
    /**
     * Get single payroll run with entries
     */
    private function getPayrollRun($id) {
        $this->requirePermission('read');
        
        $payrollRun = $this->db->selectOne(
            "SELECT pr.*, u.full_name as created_by_name
             FROM payroll_runs pr
             LEFT JOIN users u ON pr.created_by = u.id
             WHERE pr.id = :id",
            ['id' => $id]
        );
        
        if (!$payrollRun) {
            sendError('Payroll run not found', 404);
        }
        
        // Get payroll entries
        $entries = $this->db->select(
            "SELECT pe.*, s.full_name, s.staff_number, s.position, s.department
             FROM payroll_entries pe
             JOIN staff s ON pe.staff_id = s.id
             WHERE pe.payroll_run_id = :payroll_run_id
             ORDER BY s.full_name",
            ['payroll_run_id' => $id]
        );
        
        $payrollRun['entries'] = $entries;
        $payrollRun['summary'] = [
            'staff_count' => count($entries),
            'total_gross' => array_sum(array_column($entries, 'gross_pay')),
            'total_deductions' => array_sum(array_column($entries, 'total_deductions')),
            'total_net' => array_sum(array_column($entries, 'net_pay'))
        ];
        
        sendSuccess($payrollRun);
    }
    
    /**
     * Create new payroll run
     */
    private function createPayrollRun() {
        $this->requirePermission('create');
        
        $data = getRequestBody();
        $required = ['pay_period_start', 'pay_period_end', 'description'];
        validateRequired($data, $required);
        
        $this->validatePayrollRunData($data);
        
        // Check for overlapping payroll runs
        if ($this->db->exists('payroll_runs', 
            '(pay_period_start <= :end_date AND pay_period_end >= :start_date) AND status != :status',
            [
                'start_date' => $data['pay_period_start'],
                'end_date' => $data['pay_period_end'],
                'status' => 'cancelled'
            ]
        )) {
            sendError('Overlapping payroll run already exists', 409);
        }
        
        // Set defaults
        $data['status'] = 'draft';
        $data['created_by'] = $this->currentUser['id'];
        
        $payrollRun = $this->db->insert('payroll_runs', $data);
        sendSuccess($payrollRun, 'Payroll run created successfully', 201);
    }
    
    /**
     * Calculate payroll for a run
     */
    private function calculatePayroll($runId) {
        $this->requirePermission('create');
        
        // Get payroll run
        $payrollRun = $this->db->selectOne(
            "SELECT * FROM payroll_runs WHERE id = :id",
            ['id' => $runId]
        );
        
        if (!$payrollRun) {
            sendError('Payroll run not found', 404);
        }
        
        if ($payrollRun['status'] !== 'draft') {
            sendError('Can only calculate draft payroll runs', 400);
        }
        
        // Get active staff
        $staff = $this->db->select(
            "SELECT * FROM staff WHERE status = 'active' ORDER BY full_name"
        );
        
        $calculatedCount = 0;
        $errors = [];
        
        foreach ($staff as $staffMember) {
            try {
                // Check if entry already exists
                $existingEntry = $this->db->selectOne(
                    "SELECT id FROM payroll_entries WHERE payroll_run_id = :run_id AND staff_id = :staff_id",
                    ['run_id' => $runId, 'staff_id' => $staffMember['id']]
                );
                
                if ($existingEntry) {
                    continue; // Skip if already calculated
                }
                
                // Calculate salary
                $calculation = $this->calculateStaffSalary($staffMember, $payrollRun);
                
                // Create payroll entry
                $entryData = [
                    'payroll_run_id' => $runId,
                    'staff_id' => $staffMember['id'],
                    'basic_salary' => $calculation['basic_salary'],
                    'allowances' => $calculation['total_allowances'],
                    'gross_pay' => $calculation['gross_pay'],
                    'paye_tax' => $calculation['paye_tax'],
                    'nhif' => $calculation['nhif'],
                    'nssf' => $calculation['nssf'],
                    'other_deductions' => $calculation['other_deductions'],
                    'total_deductions' => $calculation['total_deductions'],
                    'net_pay' => $calculation['net_pay'],
                    'status' => 'calculated'
                ];
                
                $this->db->insert('payroll_entries', $entryData);
                $calculatedCount++;
                
            } catch (Exception $e) {
                $errors[] = "Error calculating for {$staffMember['full_name']}: " . $e->getMessage();
            }
        }
        
        // Update payroll run status
        $this->db->update('payroll_runs', 
            ['status' => 'calculated'], 
            'id = :id', 
            ['id' => $runId]
        );
        
        sendSuccess([
            'calculated_count' => $calculatedCount,
            'errors' => $errors,
            'message' => "Calculated payroll for {$calculatedCount} staff members"
        ]);
    }
    
    /**
     * Calculate individual staff salary
     */
    private function calculateStaffSalary($staff, $payrollRun) {
        $basicSalary = floatval($staff['basic_salary']);
        $houseAllowance = floatval($staff['house_allowance'] ?? 0);
        $transportAllowance = floatval($staff['transport_allowance'] ?? 0);
        $otherAllowances = floatval($staff['other_allowances'] ?? 0);
        
        $totalAllowances = $houseAllowance + $transportAllowance + $otherAllowances;
        $grossPay = $basicSalary + $totalAllowances;
        
        // Calculate PAYE tax (simplified Tanzanian tax calculation)
        $payeTax = $this->calculatePAYE($grossPay);
        
        // Calculate NHIF (simplified)
        $nhif = $this->calculateNHIF($grossPay);
        
        // Calculate NSSF (simplified)
        $nssf = $this->calculateNSSF($basicSalary);
        
        $otherDeductions = 0; // Could be loans, advances, etc.
        
        $totalDeductions = $payeTax + $nhif + $nssf + $otherDeductions;
        $netPay = $grossPay - $totalDeductions;
        
        return [
            'basic_salary' => $basicSalary,
            'total_allowances' => $totalAllowances,
            'gross_pay' => $grossPay,
            'paye_tax' => $payeTax,
            'nhif' => $nhif,
            'nssf' => $nssf,
            'other_deductions' => $otherDeductions,
            'total_deductions' => $totalDeductions,
            'net_pay' => $netPay
        ];
    }
    
    /**
     * Calculate PAYE tax (simplified Tanzanian rates)
     */
    private function calculatePAYE($grossPay) {
        $monthlyGross = $grossPay;
        $annualGross = $monthlyGross * 12;
        
        // Simplified PAYE calculation for Tanzania
        if ($annualGross <= 3600000) { // Up to 3.6M TZS
            return 0;
        } elseif ($annualGross <= 7200000) { // 3.6M - 7.2M TZS
            return ($annualGross - 3600000) * 0.09 / 12;
        } elseif ($annualGross <= 10800000) { // 7.2M - 10.8M TZS
            return (324000 + ($annualGross - 7200000) * 0.20) / 12;
        } else { // Above 10.8M TZS
            return (1044000 + ($annualGross - 10800000) * 0.30) / 12;
        }
    }
    
    /**
     * Calculate NHIF contribution (simplified)
     */
    private function calculateNHIF($grossPay) {
        // Simplified NHIF calculation
        if ($grossPay <= 15000) return 150;
        if ($grossPay <= 20000) return 300;
        if ($grossPay <= 25000) return 400;
        if ($grossPay <= 30000) return 500;
        if ($grossPay <= 35000) return 600;
        if ($grossPay <= 40000) return 750;
        if ($grossPay <= 45000) return 900;
        if ($grossPay <= 50000) return 1000;
        if ($grossPay <= 60000) return 1200;
        if ($grossPay <= 70000) return 1300;
        if ($grossPay <= 80000) return 1400;
        if ($grossPay <= 90000) return 1500;
        if ($grossPay <= 100000) return 1600;
        return 1700; // Maximum NHIF
    }
    
    /**
     * Calculate NSSF contribution (simplified)
     */
    private function calculateNSSF($basicSalary) {
        // NSSF is 10% of basic salary, max 200,000 TZS per month
        $maxContribution = 200000;
        return min($basicSalary * 0.10, $maxContribution);
    }
    
    /**
     * Approve payroll run
     */
    private function approvePayroll($runId) {
        $this->requirePermission('update');
        
        $payrollRun = $this->db->selectOne(
            "SELECT * FROM payroll_runs WHERE id = :id",
            ['id' => $runId]
        );
        
        if (!$payrollRun) {
            sendError('Payroll run not found', 404);
        }
        
        if ($payrollRun['status'] !== 'calculated') {
            sendError('Can only approve calculated payroll runs', 400);
        }
        
        // Update payroll run status
        $this->db->update('payroll_runs', 
            [
                'status' => 'approved',
                'approved_by' => $this->currentUser['id'],
                'approved_at' => date('Y-m-d H:i:s')
            ], 
            'id = :id', 
            ['id' => $runId]
        );
        
        // Update all entries to approved
        $this->db->query(
            "UPDATE payroll_entries SET status = 'approved' WHERE payroll_run_id = :run_id",
            ['run_id' => $runId]
        );
        
        sendSuccess(null, 'Payroll run approved successfully');
    }
    
    /**
     * Generate payslip
     */
    private function generatePayslip($runId, $staffId) {
        $this->requirePermission('read');
        
        if (!$staffId) {
            sendError('Staff ID required', 400);
        }
        
        // Get payroll entry
        $entry = $this->db->selectOne(
            "SELECT pe.*, s.full_name, s.staff_number, s.position, s.department,
                    pr.pay_period_start, pr.pay_period_end, pr.description
             FROM payroll_entries pe
             JOIN staff s ON pe.staff_id = s.id
             JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
             WHERE pe.payroll_run_id = :run_id AND pe.staff_id = :staff_id",
            ['run_id' => $runId, 'staff_id' => $staffId]
        );
        
        if (!$entry) {
            sendError('Payslip not found', 404);
        }
        
        // Format payslip data
        $payslip = [
            'school_info' => [
                'name' => SCHOOL_NAME,
                'address' => SCHOOL_ADDRESS,
                'phone' => SCHOOL_PHONE,
                'email' => SCHOOL_EMAIL
            ],
            'staff_info' => [
                'full_name' => $entry['full_name'],
                'staff_number' => $entry['staff_number'],
                'position' => $entry['position'],
                'department' => $entry['department']
            ],
            'period_info' => [
                'description' => $entry['description'],
                'start_date' => $entry['pay_period_start'],
                'end_date' => $entry['pay_period_end']
            ],
            'earnings' => [
                'basic_salary' => $entry['basic_salary'],
                'allowances' => $entry['allowances'],
                'gross_pay' => $entry['gross_pay']
            ],
            'deductions' => [
                'paye_tax' => $entry['paye_tax'],
                'nhif' => $entry['nhif'],
                'nssf' => $entry['nssf'],
                'other_deductions' => $entry['other_deductions'],
                'total_deductions' => $entry['total_deductions']
            ],
            'net_pay' => $entry['net_pay'],
            'generated_at' => date('Y-m-d H:i:s')
        ];
        
        sendSuccess($payslip);
    }
    
    /**
     * Get payroll statistics
     */
    public function getStats($resource) {
        $this->requirePermission('read');
        
        $currentYear = date('Y');
        
        $stats = [
            'total_payroll_ytd' => $this->db->selectOne(
                "SELECT COALESCE(SUM(pe.net_pay), 0) as total
                 FROM payroll_entries pe
                 JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                 WHERE EXTRACT(YEAR FROM pr.pay_period_end) = :year",
                ['year' => $currentYear]
            )['total'],
            
            'monthly_payroll' => $this->db->select(
                "SELECT EXTRACT(MONTH FROM pr.pay_period_end) as month,
                        COALESCE(SUM(pe.net_pay), 0) as total
                 FROM payroll_entries pe
                 JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                 WHERE EXTRACT(YEAR FROM pr.pay_period_end) = :year
                 GROUP BY EXTRACT(MONTH FROM pr.pay_period_end)
                 ORDER BY month",
                ['year' => $currentYear]
            ),
            
            'by_department' => $this->db->select(
                "SELECT s.department, 
                        COUNT(DISTINCT pe.staff_id) as staff_count,
                        COALESCE(AVG(pe.net_pay), 0) as avg_net_pay
                 FROM payroll_entries pe
                 JOIN staff s ON pe.staff_id = s.id
                 JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                 WHERE EXTRACT(YEAR FROM pr.pay_period_end) = :year
                 GROUP BY s.department
                 ORDER BY avg_net_pay DESC",
                ['year' => $currentYear]
            ),
            
            'recent_runs' => $this->db->select(
                "SELECT pr.*, COUNT(pe.id) as staff_count,
                        COALESCE(SUM(pe.net_pay), 0) as total_net
                 FROM payroll_runs pr
                 LEFT JOIN payroll_entries pe ON pr.id = pe.payroll_run_id
                 GROUP BY pr.id
                 ORDER BY pr.pay_period_end DESC
                 LIMIT 5"
            )
        ];
        
        sendSuccess($stats);
    }
    
    /**
     * Validate payroll run data
     */
    private function validatePayrollRunData($data) {
        // Validate dates
        $startDate = strtotime($data['pay_period_start']);
        $endDate = strtotime($data['pay_period_end']);
        
        if (!$startDate || !$endDate) {
            sendError('Invalid date format', 400);
        }
        
        if ($startDate >= $endDate) {
            sendError('Start date must be before end date', 400);
        }
        
        // Check if end date is not in the future
        if ($endDate > time()) {
            sendError('End date cannot be in the future', 400);
        }
    }
    
    /**
     * Get payroll-specific filters
     */
    private function getPayrollFilters() {
        $filters = [];
        
        if (isset($_GET['status'])) {
            $filters['status'] = $_GET['status'];
        }
        
        if (isset($_GET['year'])) {
            $filters['year'] = $_GET['year'];
        }
        
        if (isset($_GET['month'])) {
            $filters['month'] = $_GET['month'];
        }
        
        return $filters;
    }
    
    /**
     * Build WHERE clause for payroll runs
     */
    private function buildPayrollRunsWhere($filters) {
        $conditions = [];
        $params = [];
        
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                switch ($field) {
                    case 'status':
                        $conditions[] = "pr.status = :status";
                        $params['status'] = $value;
                        break;
                        
                    case 'year':
                        $conditions[] = "EXTRACT(YEAR FROM pr.pay_period_end) = :year";
                        $params['year'] = $value;
                        break;
                        
                    case 'month':
                        $conditions[] = "EXTRACT(MONTH FROM pr.pay_period_end) = :month";
                        $params['month'] = $value;
                        break;
                }
            }
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
