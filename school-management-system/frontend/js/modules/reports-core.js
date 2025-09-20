// Reports Module Core Data and Configuration

// Global variables for reports
let reportsData = {
    fees: [],
    payroll: [],
    procurement: [],
    students: [],
    summary: {}
};

let chartInstances = {};
let currentLanguage = 'en';
let currentDateRange = {
    start: null,
    end: null
};

// Sample data for demonstration - in real implementation, this would come from API
const sampleFeesData = [
    {
        id: 1,
        studentName: "John Mwalimu",
        studentId: "STD001",
        class: "Form 4",
        feeType: "tuition",
        amountDue: 450000,
        amountPaid: 350000,
        outstanding: 100000,
        lastPayment: "2024-02-15",
        status: "partial",
        term: "Term 1",
        academicYear: "2024"
    },
    {
        id: 2,
        studentName: "Mary Kamau",
        studentId: "STD002",
        class: "Form 3",
        feeType: "boarding",
        amountDue: 300000,
        amountPaid: 300000,
        outstanding: 0,
        lastPayment: "2024-01-20",
        status: "paid",
        term: "Term 1",
        academicYear: "2024"
    },
    {
        id: 3,
        studentName: "Peter Moshi",
        studentId: "STD003",
        class: "Form 2",
        feeType: "transport",
        amountDue: 120000,
        amountPaid: 60000,
        outstanding: 60000,
        lastPayment: "2024-01-10",
        status: "partial",
        term: "Term 1",
        academicYear: "2024"
    },
    {
        id: 4,
        studentName: "Grace Nyong'o",
        studentId: "STD004",
        class: "Form 1",
        feeType: "uniform",
        amountDue: 80000,
        amountPaid: 0,
        outstanding: 80000,
        lastPayment: null,
        status: "unpaid",
        term: "Term 1",
        academicYear: "2024"
    },
    {
        id: 5,
        studentName: "David Kilimo",
        studentId: "STD005",
        class: "Form 4",
        feeType: "tuition",
        amountDue: 450000,
        amountPaid: 450000,
        outstanding: 0,
        lastPayment: "2024-02-01",
        status: "paid",
        term: "Term 1",
        academicYear: "2024"
    }
];

const samplePayrollData = [
    {
        id: 1,
        staffName: "John Kamau",
        staffId: "STF001",
        department: "Teaching",
        position: "Mathematics Teacher",
        baseSalary: 800000,
        allowances: 150000,
        deductions: 120000,
        netSalary: 830000,
        paymentDate: "2024-02-28",
        month: "2024-02",
        status: "paid"
    },
    {
        id: 2,
        staffName: "Mary Mwalimu",
        staffId: "STF002",
        department: "Administration",
        position: "Head Teacher",
        baseSalary: 1200000,
        allowances: 300000,
        deductions: 200000,
        netSalary: 1300000,
        paymentDate: "2024-02-28",
        month: "2024-02",
        status: "paid"
    },
    {
        id: 3,
        staffName: "Peter Msomi",
        staffId: "STF003",
        department: "Teaching",
        position: "Science Teacher",
        baseSalary: 750000,
        allowances: 100000,
        deductions: 90000,
        netSalary: 760000,
        paymentDate: "2024-02-28",
        month: "2024-02",
        status: "paid"
    },
    {
        id: 4,
        staffName: "Grace Kilimo",
        staffId: "STF004",
        department: "Support",
        position: "Librarian",
        baseSalary: 500000,
        allowances: 50000,
        deductions: 60000,
        netSalary: 490000,
        paymentDate: "2024-02-28",
        month: "2024-02",
        status: "paid"
    }
];

const sampleProcurementData = [
    {
        id: 1,
        poNumber: "PO-2024-001",
        supplier: "Stationery Plus Ltd",
        department: "Administration",
        items: "Office Supplies",
        budgetAllocated: 500000,
        amountSpent: 450000,
        variance: 50000,
        status: "complete",
        date: "2024-02-10"
    },
    {
        id: 2,
        poNumber: "PO-2024-002",
        supplier: "Science Equipment Co",
        department: "Science",
        items: "Laboratory Equipment",
        budgetAllocated: 1200000,
        amountSpent: 1350000,
        variance: -150000,
        status: "complete",
        date: "2024-02-15"
    },
    {
        id: 3,
        poNumber: "PO-2024-003",
        supplier: "Library Books Suppliers",
        department: "Library",
        items: "Educational Books",
        budgetAllocated: 800000,
        amountSpent: 750000,
        variance: 50000,
        status: "partial",
        date: "2024-02-20"
    },
    {
        id: 4,
        poNumber: "PO-2024-004",
        supplier: "Maintenance Supplies",
        department: "Maintenance",
        items: "Cleaning Supplies",
        budgetAllocated: 300000,
        amountSpent: 280000,
        variance: 20000,
        status: "complete",
        date: "2024-02-25"
    }
];

// Chart color schemes
const chartColors = {
    primary: '#3498db',
    secondary: '#2c3e50',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#17a2b8',
    light: '#ecf0f1',
    dark: '#34495e'
};

const chartColorPalette = [
    '#3498db', '#e74c3c', '#27ae60', '#f39c12', 
    '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
    '#95a5a6', '#16a085', '#2980b9', '#8e44ad'
];

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('sw-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

function getStatusBadge(status) {
    const statusClasses = {
        'paid': 'success',
        'partial': 'warning',
        'unpaid': 'danger',
        'pending': 'warning',
        'complete': 'success',
        'overdue': 'danger'
    };
    
    const statusClass = statusClasses[status] || 'secondary';
    return `<span class="badge badge-${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

function getMonthName(monthNumber) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
}

function generateMonthlyData(data, dateField, valueField) {
    const monthlyData = {};
    
    data.forEach(item => {
        if (item[dateField]) {
            const date = new Date(item[dateField]);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += item[valueField] || 0;
        }
    });
    
    return monthlyData;
}

function filterDataByDateRange(data, dateField, startDate, endDate) {
    if (!startDate || !endDate) return data;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return data.filter(item => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return itemDate >= start && itemDate <= end;
    });
}

// Data aggregation functions
function aggregateFeesData() {
    const totalRevenue = sampleFeesData.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const totalOutstanding = sampleFeesData.reduce((sum, fee) => sum + fee.outstanding, 0);
    const totalDue = sampleFeesData.reduce((sum, fee) => sum + fee.amountDue, 0);
    
    return {
        totalRevenue,
        totalOutstanding,
        totalDue,
        collectionRate: calculatePercentage(totalRevenue, totalDue),
        outstandingRate: calculatePercentage(totalOutstanding, totalDue)
    };
}

function aggregatePayrollData() {
    const totalPayroll = samplePayrollData.reduce((sum, payroll) => sum + payroll.netSalary, 0);
    const totalBaseSalary = samplePayrollData.reduce((sum, payroll) => sum + payroll.baseSalary, 0);
    const totalAllowances = samplePayrollData.reduce((sum, payroll) => sum + payroll.allowances, 0);
    const totalDeductions = samplePayrollData.reduce((sum, payroll) => sum + payroll.deductions, 0);
    
    return {
        totalPayroll,
        totalBaseSalary,
        totalAllowances,
        totalDeductions,
        averageSalary: totalPayroll / samplePayrollData.length
    };
}

function aggregateProcurementData() {
    const totalBudget = sampleProcurementData.reduce((sum, proc) => sum + proc.budgetAllocated, 0);
    const totalSpent = sampleProcurementData.reduce((sum, proc) => sum + proc.amountSpent, 0);
    const totalVariance = sampleProcurementData.reduce((sum, proc) => sum + proc.variance, 0);
    
    return {
        totalBudget,
        totalSpent,
        totalVariance,
        utilizationRate: calculatePercentage(totalSpent, totalBudget),
        varianceRate: calculatePercentage(Math.abs(totalVariance), totalBudget)
    };
}

// Initialize data
function initializeReportsData() {
    reportsData.fees = sampleFeesData;
    reportsData.payroll = samplePayrollData;
    reportsData.procurement = sampleProcurementData;
    
    // Calculate summary data
    reportsData.summary = {
        fees: aggregateFeesData(),
        payroll: aggregatePayrollData(),
        procurement: aggregateProcurementData()
    };
    
    // Set default date range (last 6 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    currentDateRange.start = startDate.toISOString().split('T')[0];
    currentDateRange.end = endDate.toISOString().split('T')[0];
    
    // Update date inputs
    const startInput = document.getElementById('dateRangeStart');
    const endInput = document.getElementById('dateRangeEnd');
    
    if (startInput) startInput.value = currentDateRange.start;
    if (endInput) endInput.value = currentDateRange.end;
}

// API Integration Functions
async function loadReportsDataFromAPI() {
    try {
        showLoading(true);
        
        // Load dashboard stats which includes reports data
        const response = await window.apiClient.getDashboardStats();
        
        if (response.success && response.data) {
            const data = response.data;
            
            // Update fees data from API
            if (data.recent_activities && data.recent_activities.recent_payments) {
                reportsData.fees = data.recent_activities.recent_payments.map(payment => ({
                    id: payment.id,
                    studentName: payment.student_name,
                    studentId: payment.student_id,
                    class: payment.class,
                    feeType: payment.fee_type,
                    amountDue: parseFloat(payment.total_fees) || 0,
                    amountPaid: parseFloat(payment.amount_paid) || 0,
                    outstanding: (parseFloat(payment.total_fees) || 0) - (parseFloat(payment.amount_paid) || 0),
                    lastPayment: payment.payment_date,
                    status: payment.status,
                    term: "Term 1", // Default for now
                    academicYear: new Date().getFullYear().toString()
                }));
            }
            
            // Update procurement data from API
            if (data.recent_activities && data.recent_activities.recent_purchase_orders) {
                reportsData.procurement = data.recent_activities.recent_purchase_orders.map(po => ({
                    id: po.id,
                    poNumber: po.po_number,
                    supplier: po.supplier_name,
                    department: po.department || 'General',
                    category: po.category || 'Supplies',
                    amount: parseFloat(po.total_amount) || 0,
                    date: po.created_at,
                    status: po.status,
                    description: po.description || 'Purchase Order'
                }));
            }
            
            // Update summary from API financial data
            if (data.financial) {
                reportsData.summary = {
                    fees: {
                        totalCollected: data.financial.total_fees_collected_ytd || 0,
                        totalOutstanding: data.financial.total_fees_outstanding || 0,
                        collectionRate: data.financial.fee_collection_rate || 0
                    },
                    payroll: {
                        totalPaid: data.financial.total_payroll_ytd || 0,
                        averageSalary: data.financial.average_salary || 0,
                        staffCount: data.overview.total_staff || 0
                    },
                    procurement: {
                        totalSpent: data.financial.total_procurement_ytd || 0,
                        budgetUtilization: data.financial.budget_utilization || 0,
                        supplierCount: data.overview.active_suppliers || 0
                    }
                };
            }
            
            showNotification('Reports data loaded from database', 'success');
            
        } else {
            throw new Error('Failed to load reports data from API');
        }
        
    } catch (error) {
        console.warn('Failed to load reports data from API, using sample data:', error);
        initializeSampleData();
        showNotification('Using demo data - API connection failed', 'warning');
    } finally {
        showLoading(false);
    }
}

async function exportReportData(reportType, format) {
    try {
        showLoading(true);
        
        const response = await window.apiClient.exportReport(reportType, format, currentDateRange);
        
        if (response.success) {
            // Handle file download
            if (response.data && response.data.downloadUrl) {
                window.open(response.data.downloadUrl, '_blank');
            }
            showNotification(`${reportType} report exported successfully`, 'success');
        } else {
            throw new Error(response.message || 'Failed to export report');
        }
        
    } catch (error) {
        console.error('Failed to export report:', error);
        showNotification('Failed to export report. Using local export.', 'warning');
        // Fallback to local export functionality
        return false;
    } finally {
        showLoading(false);
    }
}

// Show/hide loading state
function showLoading(show) {
    const loadingElements = document.querySelectorAll('.summary-card, .chart-container, .table-container');
    loadingElements.forEach(element => {
        if (show) {
            element.style.opacity = '0.6';
            element.style.pointerEvents = 'none';
        } else {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
        }
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export data structure for other modules
window.reportsData = reportsData;
window.chartInstances = chartInstances;
window.currentLanguage = currentLanguage;
window.currentDateRange = currentDateRange;
window.loadReportsDataFromAPI = loadReportsDataFromAPI;
window.exportReportData = exportReportData;
