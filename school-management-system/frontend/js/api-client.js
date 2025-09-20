/**
 * API Client for School Management System
 * Handles all API communication with the PHP backend
 */

class APIClient {
    constructor() {
        // Use environment-based URL
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000/api'
            : 'https://school-management-api.onrender.com/api';
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    /**
     * Get authentication headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Handle authentication errors
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.setToken(null);
                if (window.location.pathname !== '/login.html') {
                    window.location.href = '/login.html';
                }
            }
            
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Upload file
     */
    async upload(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'POST',
            headers: {
                'Authorization': this.token ? `Bearer ${this.token}` : undefined
            },
            body: formData
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    // ==================== AUTHENTICATION ====================

    /**
     * Login user
     */
    async login(username, password) {
        const response = await this.post('/auth/login', {
            username,
            password
        });
        
        if (response.data && response.data.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.setToken(null);
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        return this.get('/auth/me');
    }

    /**
     * Refresh token
     */
    async refreshToken(refreshToken) {
        const response = await this.post('/auth/refresh', {
            refresh_token: refreshToken
        });
        
        if (response.data && response.data.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    // ==================== STUDENTS ====================

    /**
     * Get all students
     */
    async getStudents(params = {}) {
        return this.get('/students', params);
    }

    /**
     * Get student by ID
     */
    async getStudent(id) {
        return this.get(`/students/${id}`);
    }

    /**
     * Create new student
     */
    async createStudent(data) {
        return this.post('/students', data);
    }

    /**
     * Update student
     */
    async updateStudent(id, data) {
        return this.put(`/students/${id}`, data);
    }

    /**
     * Delete student
     */
    async deleteStudent(id) {
        return this.delete(`/students/${id}`);
    }

    /**
     * Get student statistics
     */
    async getStudentStats() {
        return this.get('/students/stats');
    }

    // ==================== FEES ====================

    /**
     * Get fee structures
     */
    async getFeeStructures(params = {}) {
        return this.get('/fees/structure', params);
    }

    /**
     * Create fee structure
     */
    async createFeeStructure(data) {
        return this.post('/fees/structure', data);
    }

    /**
     * Get all payments
     */
    async getPayments(params = {}) {
        return this.get('/fees/payments', params);
    }

    /**
     * Create payment
     */
    async createPayment(data) {
        return this.post('/fees/payments', data);
    }

    /**
     * Get student payments
     */
    async getStudentPayments(studentId) {
        return this.get(`/fees/${studentId}/payments`);
    }

    /**
     * Get fee statistics
     */
    async getFeeStats() {
        return this.get('/fees/stats');
    }

    // ==================== STAFF ====================

    /**
     * Get all staff
     */
    async getStaff(params = {}) {
        return this.get('/staff', params);
    }

    /**
     * Get staff by ID
     */
    async getStaffMember(id) {
        return this.get(`/staff/${id}`);
    }

    /**
     * Create new staff
     */
    async createStaff(data) {
        return this.post('/staff', data);
    }

    /**
     * Update staff
     */
    async updateStaff(id, data) {
        return this.put(`/staff/${id}`, data);
    }

    /**
     * Delete staff
     */
    async deleteStaff(id) {
        return this.delete(`/staff/${id}`);
    }

    /**
     * Get staff statistics
     */
    async getStaffStats() {
        return this.get('/staff/stats');
    }

    // ==================== PAYROLL ====================

    /**
     * Get payroll runs
     */
    async getPayrollRuns(params = {}) {
        return this.get('/payroll/runs', params);
    }

    /**
     * Create payroll run
     */
    async createPayrollRun(data) {
        return this.post('/payroll/runs', data);
    }

    /**
     * Calculate payroll
     */
    async calculatePayroll(runId) {
        return this.post(`/payroll/${runId}/calculate`);
    }

    /**
     * Approve payroll
     */
    async approvePayroll(runId) {
        return this.post(`/payroll/${runId}/approve`);
    }

    /**
     * Get payslip
     */
    async getPayslip(runId, staffId) {
        return this.get(`/payroll/${runId}/payslip`, { staff_id: staffId });
    }

    // ==================== PROCUREMENT ====================

    /**
     * Get suppliers
     */
    async getSuppliers(params = {}) {
        return this.get('/procurement/suppliers', params);
    }

    /**
     * Create supplier
     */
    async createSupplier(data) {
        return this.post('/procurement/suppliers', data);
    }

    /**
     * Get purchase orders
     */
    async getPurchaseOrders(params = {}) {
        return this.get('/procurement/purchase-orders', params);
    }

    /**
     * Create purchase order
     */
    async createPurchaseOrder(data) {
        return this.post('/procurement/purchase-orders', data);
    }

    /**
     * Get procurement statistics
     */
    async getProcurementStats() {
        return this.get('/procurement/stats');
    }

    // ==================== REPORTS ====================

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        return this.get('/reports/dashboard');
    }

    /**
     * Get financial reports
     */
    async getFinancialReports(type = null, params = {}) {
        const endpoint = type ? `/reports/financial/${type}` : '/reports/financial';
        return this.get(endpoint, params);
    }

    /**
     * Get student reports
     */
    async getStudentReports(type = null, params = {}) {
        const endpoint = type ? `/reports/students/${type}` : '/reports/students';
        return this.get(endpoint, params);
    }

    /**
     * Get staff reports
     */
    async getStaffReports(type = null, params = {}) {
        const endpoint = type ? `/reports/staff/${type}` : '/reports/staff';
        return this.get(endpoint, params);
    }

    /**
     * Export report
     */
    async exportReport(type, params = {}) {
        return this.get(`/reports/export/${type}`, params);
    }

    // ==================== SETTINGS ====================

    /**
     * Get all settings
     */
    async getSettings() {
        return this.get('/settings');
    }

    /**
     * Update settings
     */
    async updateSettings(data) {
        return this.put('/settings', data);
    }

    /**
     * Create backup
     */
    async createBackup() {
        return this.post('/settings/backup');
    }

    /**
     * Restore backup
     */
    async restoreBackup(file) {
        const formData = new FormData();
        formData.append('backup_file', file);
        return this.upload('/settings/restore', formData);
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Handle API errors with user-friendly messages
     */
    handleError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        let message = 'An error occurred. Please try again.';
        
        if (error.message.includes('Network')) {
            message = 'Network error. Please check your connection.';
        } else if (error.message.includes('401')) {
            message = 'Authentication required. Please login.';
        } else if (error.message.includes('403')) {
            message = 'You do not have permission for this action.';
        } else if (error.message.includes('404')) {
            message = 'Resource not found.';
        } else if (error.message.includes('500')) {
            message = 'Server error. Please try again later.';
        } else if (error.message) {
            message = error.message;
        }
        
        return message;
    }
}

// Create global API client instance
window.apiClient = new APIClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
