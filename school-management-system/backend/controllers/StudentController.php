<?php
/**
 * Student Controller
 * Handles student management operations
 */

require_once __DIR__ . '/BaseController.php';

class StudentController extends BaseController {
    
    protected function getResourceName() {
        return 'students';
    }
    
    /**
     * Get all students with pagination and filters
     */
    protected function getAll($pagination, $filters, $search) {
        $searchFields = ['full_name', 'student_id', 'class_form', 'phone', 'email'];
        $where = $this->buildWhereClause($filters, $search, $searchFields);
        
        $sql = "SELECT s.*, 
                       EXTRACT(YEAR FROM AGE(s.date_of_birth)) as age,
                       COUNT(sp.id) as payment_count,
                       COALESCE(SUM(sp.amount), 0) as total_paid
                FROM students s
                LEFT JOIN student_payments sp ON s.id = sp.student_id
                {$where['clause']}
                GROUP BY s.id
                ORDER BY s.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        $params = array_merge($where['params'], [
            'limit' => $pagination['limit'],
            'offset' => $pagination['offset']
        ]);
        
        return $this->db->select($sql, $params);
    }
    
    /**
     * Get single student with related data
     */
    protected function getOne($id) {
        $student = $this->db->selectOne(
            "SELECT s.*, 
                    EXTRACT(YEAR FROM AGE(s.date_of_birth)) as age
             FROM students s 
             WHERE s.id = :id",
            ['id' => $id]
        );
        
        if (!$student) {
            return null;
        }
        
        // Get student payments
        $payments = $this->db->select(
            "SELECT sp.*, fs.fee_type, fs.amount as fee_amount
             FROM student_payments sp
             JOIN fee_structure fs ON sp.fee_structure_id = fs.id
             WHERE sp.student_id = :student_id
             ORDER BY sp.payment_date DESC",
            ['student_id' => $id]
        );
        
        // Get outstanding fees
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
                'student_id' => $id,
                'class_form' => $student['class_form'],
                'academic_year' => CURRENT_ACADEMIC_YEAR
            ]
        );
        
        $student['payments'] = $payments;
        $student['outstanding_fees'] = $outstandingFees;
        $student['total_paid'] = array_sum(array_column($payments, 'amount'));
        $student['total_outstanding'] = array_sum(array_column($outstandingFees, 'outstanding_amount'));
        
        return $student;
    }
    
    /**
     * Get count of students
     */
    protected function getCount($filters, $search) {
        $searchFields = ['full_name', 'student_id', 'class_form', 'phone', 'email'];
        $where = $this->buildWhereClause($filters, $search, $searchFields);
        
        return $this->db->count('students', $where['clause'], $where['params']);
    }
    
    /**
     * Create new student
     */
    protected function create($data) {
        // Generate student ID if not provided
        if (!isset($data['student_id']) || empty($data['student_id'])) {
            $data['student_id'] = $this->generateStudentId();
        }
        
        // Set default status
        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }
        
        // Set admission date if not provided
        if (!isset($data['admission_date'])) {
            $data['admission_date'] = date('Y-m-d');
        }
        
        return $this->db->insert('students', $data);
    }
    
    /**
     * Update student
     */
    protected function update($id, $data) {
        // Check if student exists
        $existing = $this->db->selectOne("SELECT id FROM students WHERE id = :id", ['id' => $id]);
        
        if (!$existing) {
            return null;
        }
        
        return $this->db->update('students', $data, 'id = :id', ['id' => $id]);
    }
    
    /**
     * Delete student (soft delete by setting status to inactive)
     */
    protected function delete($id) {
        return $this->db->update('students', 
            ['status' => 'inactive'], 
            'id = :id', 
            ['id' => $id]
        );
    }
    
    /**
     * Validate create data
     */
    protected function validateCreateData($data) {
        $required = ['full_name', 'class_form', 'gender'];
        validateRequired($data, $required);
        
        $this->validateStudentData($data);
    }
    
    /**
     * Validate update data
     */
    protected function validateUpdateData($data, $id) {
        $this->validateStudentData($data, $id);
    }
    
    /**
     * Validate student data
     */
    private function validateStudentData($data, $id = null) {
        // Validate student ID uniqueness if provided
        if (isset($data['student_id'])) {
            $existingCondition = "student_id = :student_id";
            $params = ['student_id' => $data['student_id']];
            
            if ($id) {
                $existingCondition .= " AND id != :id";
                $params['id'] = $id;
            }
            
            if ($this->db->exists('students', $existingCondition, $params)) {
                sendError('Student ID already exists', 409);
            }
        }
        
        // Validate gender
        if (isset($data['gender']) && !in_array($data['gender'], ['Male', 'Female'])) {
            sendError('Gender must be Male or Female', 400);
        }
        
        // Validate class form
        if (isset($data['class_form'])) {
            $validClasses = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
            if (!in_array($data['class_form'], $validClasses)) {
                sendError('Invalid class form', 400);
            }
        }
        
        // Validate email if provided
        if (isset($data['email']) && !empty($data['email']) && !isValidEmail($data['email'])) {
            sendError('Invalid email format', 400);
        }
        
        // Validate phone if provided
        if (isset($data['phone']) && !empty($data['phone']) && !isValidPhone($data['phone'])) {
            sendError('Invalid phone number format', 400);
        }
        
        // Validate parent phone if provided
        if (isset($data['parent_guardian_phone']) && !empty($data['parent_guardian_phone']) && !isValidPhone($data['parent_guardian_phone'])) {
            sendError('Invalid parent/guardian phone number format', 400);
        }
        
        // Validate parent email if provided
        if (isset($data['parent_guardian_email']) && !empty($data['parent_guardian_email']) && !isValidEmail($data['parent_guardian_email'])) {
            sendError('Invalid parent/guardian email format', 400);
        }
        
        // Validate date of birth
        if (isset($data['date_of_birth']) && !empty($data['date_of_birth'])) {
            $dob = strtotime($data['date_of_birth']);
            if (!$dob || $dob > time()) {
                sendError('Invalid date of birth', 400);
            }
        }
        
        // Validate status
        if (isset($data['status'])) {
            $validStatuses = ['active', 'inactive', 'graduated', 'transferred'];
            if (!in_array($data['status'], $validStatuses)) {
                sendError('Invalid status', 400);
            }
        }
    }
    
    /**
     * Generate unique student ID
     */
    private function generateStudentId() {
        do {
            $studentId = generateStudentId();
        } while ($this->db->exists('students', 'student_id = :student_id', ['student_id' => $studentId]));
        
        return $studentId;
    }
    
    /**
     * Get students by class
     */
    public function getByClass($classForm) {
        $this->requirePermission('read');
        
        $students = $this->db->select(
            "SELECT * FROM students WHERE class_form = :class_form AND status = 'active' ORDER BY full_name",
            ['class_form' => $classForm]
        );
        
        sendSuccess($students);
    }
    
    /**
     * Get student statistics
     */
    public function getStats($resource) {
        $this->requirePermission('read');
        
        $stats = [
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
            'recent_admissions' => $this->db->count('students', 
                "admission_date >= :date AND status = 'active'", 
                ['date' => date('Y-m-d', strtotime('-30 days'))]
            )
        ];
        
        sendSuccess($stats);
    }
    
    /**
     * Export students to CSV
     */
    public function getExport($resource) {
        $this->requirePermission('read');
        
        $students = $this->db->select(
            "SELECT student_id, full_name, class_form, gender, date_of_birth, phone, email, 
                    parent_guardian_name, parent_guardian_phone, admission_date, status
             FROM students 
             ORDER BY class_form, full_name"
        );
        
        if (empty($students)) {
            sendError('No students found for export', 404);
        }
        
        arrayToCsv($students, 'students_export_' . date('Y-m-d') . '.csv');
    }
    
    /**
     * Bulk import students
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
            'message' => "Successfully imported {$imported} students"
        ]);
    }
    
    /**
     * Import students from CSV
     */
    private function importFromCsv($filePath) {
        $imported = 0;
        $errors = [];
        
        if (($handle = fopen($filePath, "r")) !== FALSE) {
            $header = fgetcsv($handle);
            
            while (($data = fgetcsv($handle)) !== FALSE) {
                try {
                    $studentData = array_combine($header, $data);
                    
                    // Generate student ID if not provided
                    if (empty($studentData['student_id'])) {
                        $studentData['student_id'] = $this->generateStudentId();
                    }
                    
                    $this->validateCreateData($studentData);
                    $this->create($studentData);
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Row " . ($imported + 1) . ": " . $e->getMessage();
                }
            }
            
            fclose($handle);
        }
        
        if (!empty($errors)) {
            logMessage("Student import errors: " . implode(', ', $errors), 'WARNING');
        }
        
        return $imported;
    }
}
?>
