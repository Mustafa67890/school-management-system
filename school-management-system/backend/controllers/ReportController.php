<?php
/**
 * Report Controller
 * Handles reports and analytics across all modules
 */

require_once __DIR__ . '/BaseController.php';

class ReportController extends BaseController {
    
    protected function getResourceName() {
        return 'reports';
    }
    
    public function handleRequest($method, $resource = null, $action = null) {
        try {
            $this->currentUser = getCurrentUser();
            
            // Handle report-specific endpoints
            if ($method === 'GET') {
                switch ($resource) {
                    case 'dashboard':
                        $this->getDashboardStats();
                        break;
                        
                    case 'financial':
                        $this->getFinancialReports($action);
                        break;
                        
                    case 'students':
                        $this->getStudentReports($action);
                        break;
                        
                    case 'staff':
                        $this->getStaffReports($action);
                        break;
                        
                    case 'procurement':
                        $this->getProcurementReports($action);
                        break;
                        
                    case 'analytics':
                        $this->getAnalytics($action);
                        break;
                        
                    case 'export':
                        $this->exportReport($action);
                        break;
                        
                    default:
                        $this->getAllReports();
                }
            } else {
                sendError('Method not allowed', 405);
            }
            
        } catch (Exception $e) {
            error_log("Report Controller error: " . $e->getMessage());
            sendError($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Get dashboard statistics
     */
    private function getDashboardStats() {
        $this->requirePermission('read');
        
        $currentYear = date('Y');
        $currentMonth = date('m');
        
        $stats = [
            'overview' => [
                'total_students' => $this->db->count('students', "status = 'active'"),
                'total_staff' => $this->db->count('staff', "status = 'active'"),
                'total_suppliers' => $this->db->count('suppliers', "status = 'active'"),
                'active_purchase_orders' => $this->db->count('purchase_orders', "status IN ('pending', 'approved')")
            ],
            
            'financial' => [
                'total_fees_collected_ytd' => $this->db->selectOne(
                    "SELECT COALESCE(SUM(amount), 0) as total
                     FROM student_payments 
                     WHERE EXTRACT(YEAR FROM payment_date) = :year",
                    ['year' => $currentYear]
                )['total'],
                
                'total_payroll_ytd' => $this->db->selectOne(
                    "SELECT COALESCE(SUM(pe.net_pay), 0) as total
                     FROM payroll_entries pe
                     JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                     WHERE EXTRACT(YEAR FROM pr.pay_period_end) = :year",
                    ['year' => $currentYear]
                )['total'],
                
                'total_procurement_ytd' => $this->db->selectOne(
                    "SELECT COALESCE(SUM(total_amount), 0) as total
                     FROM purchase_orders 
                     WHERE EXTRACT(YEAR FROM order_date) = :year",
                    ['year' => $currentYear]
                )['total'],
                
                'outstanding_fees' => $this->calculateOutstandingFees()
            ],
            
            'monthly_trends' => [
                'fees_collection' => $this->getMonthlyFeesCollection($currentYear),
                'payroll_expenses' => $this->getMonthlyPayrollExpenses($currentYear),
                'procurement_spending' => $this->getMonthlyProcurementSpending($currentYear)
            ],
            
            'recent_activities' => [
                'recent_payments' => $this->getRecentPayments(10),
                'recent_purchase_orders' => $this->getRecentPurchaseOrders(10),
                'recent_payroll_runs' => $this->getRecentPayrollRuns(5)
            ]
        ];
        
        sendSuccess($stats);
    }
    
    /**
     * Get financial reports
     */
    private function getFinancialReports($action) {
        $this->requirePermission('read');
        
        switch ($action) {
            case 'fees-summary':
                $this->getFeesSummaryReport();
                break;
                
            case 'payment-analysis':
                $this->getPaymentAnalysisReport();
                break;
                
            case 'outstanding-fees':
                $this->getOutstandingFeesReport();
                break;
                
            case 'revenue-trends':
                $this->getRevenueTrendsReport();
                break;
                
            default:
                $this->getAllFinancialReports();
        }
    }
    
    /**
     * Get student reports
     */
    private function getStudentReports($action) {
        $this->requirePermission('read');
        
        switch ($action) {
            case 'enrollment':
                $this->getEnrollmentReport();
                break;
                
            case 'by-class':
                $this->getStudentsByClassReport();
                break;
                
            case 'demographics':
                $this->getStudentDemographicsReport();
                break;
                
            default:
                $this->getAllStudentReports();
        }
    }
    
    /**
     * Get staff reports
     */
    private function getStaffReports($action) {
        $this->requirePermission('read');
        
        switch ($action) {
            case 'payroll-summary':
                $this->getPayrollSummaryReport();
                break;
                
            case 'department-costs':
                $this->getDepartmentCostsReport();
                break;
                
            case 'salary-analysis':
                $this->getSalaryAnalysisReport();
                break;
                
            default:
                $this->getAllStaffReports();
        }
    }
    
    /**
     * Get procurement reports
     */
    private function getProcurementReports($action) {
        $this->requirePermission('read');
        
        switch ($action) {
            case 'spending-analysis':
                $this->getProcurementSpendingReport();
                break;
                
            case 'supplier-performance':
                $this->getSupplierPerformanceReport();
                break;
                
            case 'budget-variance':
                $this->getBudgetVarianceReport();
                break;
                
            default:
                $this->getAllProcurementReports();
        }
    }
    
    /**
     * Calculate outstanding fees
     */
    private function calculateOutstandingFees() {
        $currentYear = CURRENT_ACADEMIC_YEAR;
        
        $result = $this->db->selectOne(
            "SELECT 
                SUM(fs.amount * student_count.count) as total_expected,
                COALESCE(SUM(sp.amount), 0) as total_paid
             FROM fee_structure fs
             CROSS JOIN (
                 SELECT COUNT(*) as count 
                 FROM students 
                 WHERE status = 'active'
             ) student_count
             LEFT JOIN student_payments sp ON fs.id = sp.fee_structure_id
             WHERE fs.academic_year = :year",
            ['year' => $currentYear]
        );
        
        $totalExpected = floatval($result['total_expected'] ?? 0);
        $totalPaid = floatval($result['total_paid'] ?? 0);
        
        return $totalExpected - $totalPaid;
    }
    
    /**
     * Get monthly fees collection
     */
    private function getMonthlyFeesCollection($year) {
        return $this->db->select(
            "SELECT EXTRACT(MONTH FROM payment_date) as month,
                    COALESCE(SUM(amount), 0) as total
             FROM student_payments 
             WHERE EXTRACT(YEAR FROM payment_date) = :year
             GROUP BY EXTRACT(MONTH FROM payment_date)
             ORDER BY month",
            ['year' => $year]
        );
    }
    
    /**
     * Get monthly payroll expenses
     */
    private function getMonthlyPayrollExpenses($year) {
        return $this->db->select(
            "SELECT EXTRACT(MONTH FROM pr.pay_period_end) as month,
                    COALESCE(SUM(pe.net_pay), 0) as total
             FROM payroll_entries pe
             JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
             WHERE EXTRACT(YEAR FROM pr.pay_period_end) = :year
             GROUP BY EXTRACT(MONTH FROM pr.pay_period_end)
             ORDER BY month",
            ['year' => $year]
        );
    }
    
    /**
     * Get monthly procurement spending
     */
    private function getMonthlyProcurementSpending($year) {
        return $this->db->select(
            "SELECT EXTRACT(MONTH FROM order_date) as month,
                    COALESCE(SUM(total_amount), 0) as total
             FROM purchase_orders 
             WHERE EXTRACT(YEAR FROM order_date) = :year
             GROUP BY EXTRACT(MONTH FROM order_date)
             ORDER BY month",
            ['year' => $year]
        );
    }
    
    /**
     * Get recent payments
     */
    private function getRecentPayments($limit) {
        return $this->db->select(
            "SELECT sp.*, s.full_name as student_name, s.student_id, s.class_form,
                    fs.fee_type
             FROM student_payments sp
             JOIN students s ON sp.student_id = s.id
             JOIN fee_structure fs ON sp.fee_structure_id = fs.id
             ORDER BY sp.payment_date DESC, sp.created_at DESC
             LIMIT :limit",
            ['limit' => $limit]
        );
    }
    
    /**
     * Get recent purchase orders
     */
    private function getRecentPurchaseOrders($limit) {
        return $this->db->select(
            "SELECT po.*, s.name as supplier_name
             FROM purchase_orders po
             JOIN suppliers s ON po.supplier_id = s.id
             ORDER BY po.created_at DESC
             LIMIT :limit",
            ['limit' => $limit]
        );
    }
    
    /**
     * Get recent payroll runs
     */
    private function getRecentPayrollRuns($limit) {
        return $this->db->select(
            "SELECT pr.*, COUNT(pe.id) as staff_count,
                    COALESCE(SUM(pe.net_pay), 0) as total_net
             FROM payroll_runs pr
             LEFT JOIN payroll_entries pe ON pr.id = pe.payroll_run_id
             GROUP BY pr.id
             ORDER BY pr.created_at DESC
             LIMIT :limit",
            ['limit' => $limit]
        );
    }
    
    /**
     * Get fees summary report
     */
    private function getFeesSummaryReport() {
        $dateRange = $this->getDateRange();
        
        $summary = [
            'total_collected' => $this->db->selectOne(
                "SELECT COALESCE(SUM(amount), 0) as total
                 FROM student_payments 
                 WHERE payment_date BETWEEN :start_date AND :end_date",
                $dateRange
            )['total'],
            
            'by_fee_type' => $this->db->select(
                "SELECT fs.fee_type, COALESCE(SUM(sp.amount), 0) as total
                 FROM fee_structure fs
                 LEFT JOIN student_payments sp ON fs.id = sp.fee_structure_id
                   AND sp.payment_date BETWEEN :start_date AND :end_date
                 GROUP BY fs.fee_type
                 ORDER BY total DESC",
                $dateRange
            ),
            
            'by_class' => $this->db->select(
                "SELECT s.class_form, COALESCE(SUM(sp.amount), 0) as total
                 FROM students s
                 LEFT JOIN student_payments sp ON s.id = sp.student_id
                   AND sp.payment_date BETWEEN :start_date AND :end_date
                 WHERE s.status = 'active'
                 GROUP BY s.class_form
                 ORDER BY s.class_form",
                $dateRange
            ),
            
            'by_payment_method' => $this->db->select(
                "SELECT payment_method, COALESCE(SUM(amount), 0) as total
                 FROM student_payments 
                 WHERE payment_date BETWEEN :start_date AND :end_date
                 GROUP BY payment_method
                 ORDER BY total DESC",
                $dateRange
            )
        ];
        
        sendSuccess($summary);
    }
    
    /**
     * Get enrollment report
     */
    private function getEnrollmentReport() {
        $report = [
            'total_students' => $this->db->count('students', "status = 'active'"),
            
            'by_class' => $this->db->select(
                "SELECT class_form, COUNT(*) as count
                 FROM students 
                 WHERE status = 'active'
                 GROUP BY class_form
                 ORDER BY class_form"
            ),
            
            'by_gender' => $this->db->select(
                "SELECT gender, COUNT(*) as count
                 FROM students 
                 WHERE status = 'active'
                 GROUP BY gender"
            ),
            
            'enrollment_trends' => $this->db->select(
                "SELECT EXTRACT(MONTH FROM admission_date) as month,
                        EXTRACT(YEAR FROM admission_date) as year,
                        COUNT(*) as count
                 FROM students 
                 WHERE admission_date >= :start_date
                 GROUP BY EXTRACT(YEAR FROM admission_date), EXTRACT(MONTH FROM admission_date)
                 ORDER BY year DESC, month DESC
                 LIMIT 12",
                ['start_date' => date('Y-m-d', strtotime('-12 months'))]
            )
        ];
        
        sendSuccess($report);
    }
    
    /**
     * Get payroll summary report
     */
    private function getPayrollSummaryReport() {
        $dateRange = $this->getDateRange();
        
        $report = [
            'total_payroll' => $this->db->selectOne(
                "SELECT COALESCE(SUM(pe.net_pay), 0) as total
                 FROM payroll_entries pe
                 JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                 WHERE pr.pay_period_end BETWEEN :start_date AND :end_date",
                $dateRange
            )['total'],
            
            'by_department' => $this->db->select(
                "SELECT s.department, 
                        COUNT(pe.id) as staff_count,
                        COALESCE(SUM(pe.net_pay), 0) as total_net,
                        COALESCE(AVG(pe.net_pay), 0) as avg_net
                 FROM payroll_entries pe
                 JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                 JOIN staff s ON pe.staff_id = s.id
                 WHERE pr.pay_period_end BETWEEN :start_date AND :end_date
                 GROUP BY s.department
                 ORDER BY total_net DESC",
                $dateRange
            ),
            
            'salary_distribution' => $this->db->select(
                "SELECT 
                    CASE 
                        WHEN pe.net_pay < 500000 THEN 'Below 500K'
                        WHEN pe.net_pay < 1000000 THEN '500K - 1M'
                        WHEN pe.net_pay < 1500000 THEN '1M - 1.5M'
                        ELSE 'Above 1.5M'
                    END as salary_range,
                    COUNT(*) as count
                 FROM payroll_entries pe
                 JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
                 WHERE pr.pay_period_end BETWEEN :start_date AND :end_date
                 GROUP BY 
                    CASE 
                        WHEN pe.net_pay < 500000 THEN 'Below 500K'
                        WHEN pe.net_pay < 1000000 THEN '500K - 1M'
                        WHEN pe.net_pay < 1500000 THEN '1M - 1.5M'
                        ELSE 'Above 1.5M'
                    END
                 ORDER BY MIN(pe.net_pay)",
                $dateRange
            )
        ];
        
        sendSuccess($report);
    }
    
    /**
     * Get date range from query parameters
     */
    private function getDateRange() {
        $startDate = $_GET['start_date'] ?? date('Y-m-01'); // First day of current month
        $endDate = $_GET['end_date'] ?? date('Y-m-t'); // Last day of current month
        
        return [
            'start_date' => $startDate,
            'end_date' => $endDate
        ];
    }
    
    /**
     * Export report to CSV
     */
    private function exportReport($reportType) {
        $this->requirePermission('read');
        
        switch ($reportType) {
            case 'students':
                $this->exportStudentsReport();
                break;
                
            case 'payments':
                $this->exportPaymentsReport();
                break;
                
            case 'staff':
                $this->exportStaffReport();
                break;
                
            case 'procurement':
                $this->exportProcurementReport();
                break;
                
            default:
                sendError('Invalid report type for export', 400);
        }
    }
    
    /**
     * Export students report
     */
    private function exportStudentsReport() {
        $students = $this->db->select(
            "SELECT student_id, full_name, class_form, gender, date_of_birth,
                    phone, email, admission_date, status
             FROM students 
             ORDER BY class_form, full_name"
        );
        
        if (empty($students)) {
            sendError('No student data found for export', 404);
        }
        
        arrayToCsv($students, 'students_report_' . date('Y-m-d') . '.csv');
    }
    
    /**
     * Export payments report
     */
    private function exportPaymentsReport() {
        $dateRange = $this->getDateRange();
        
        $payments = $this->db->select(
            "SELECT sp.receipt_number, sp.payment_date, sp.amount, sp.payment_method,
                    s.student_id, s.full_name as student_name, s.class_form,
                    fs.fee_type
             FROM student_payments sp
             JOIN students s ON sp.student_id = s.id
             JOIN fee_structure fs ON sp.fee_structure_id = fs.id
             WHERE sp.payment_date BETWEEN :start_date AND :end_date
             ORDER BY sp.payment_date DESC",
            $dateRange
        );
        
        if (empty($payments)) {
            sendError('No payment data found for export', 404);
        }
        
        arrayToCsv($payments, 'payments_report_' . date('Y-m-d') . '.csv');
    }
    
    // Placeholder methods for comprehensive reporting
    private function getAllReports() {
        sendSuccess([
            'available_reports' => [
                'dashboard' => 'Dashboard Statistics',
                'financial' => 'Financial Reports',
                'students' => 'Student Reports',
                'staff' => 'Staff Reports',
                'procurement' => 'Procurement Reports',
                'analytics' => 'Advanced Analytics'
            ]
        ]);
    }
    
    private function getAllFinancialReports() {
        sendSuccess([
            'financial_reports' => [
                'fees-summary' => 'Fees Collection Summary',
                'payment-analysis' => 'Payment Analysis',
                'outstanding-fees' => 'Outstanding Fees Report',
                'revenue-trends' => 'Revenue Trends Analysis'
            ]
        ]);
    }
    
    private function getAllStudentReports() {
        sendSuccess([
            'student_reports' => [
                'enrollment' => 'Student Enrollment Report',
                'by-class' => 'Students by Class Report',
                'demographics' => 'Student Demographics Report'
            ]
        ]);
    }
    
    private function getAllStaffReports() {
        sendSuccess([
            'staff_reports' => [
                'payroll-summary' => 'Payroll Summary Report',
                'department-costs' => 'Department Costs Report',
                'salary-analysis' => 'Salary Analysis Report'
            ]
        ]);
    }
    
    private function getAllProcurementReports() {
        sendSuccess([
            'procurement_reports' => [
                'spending-analysis' => 'Procurement Spending Analysis',
                'supplier-performance' => 'Supplier Performance Report',
                'budget-variance' => 'Budget Variance Report'
            ]
        ]);
    }
    
    // Required by BaseController but not used in ReportController
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
