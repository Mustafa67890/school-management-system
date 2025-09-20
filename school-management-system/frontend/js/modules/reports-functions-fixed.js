// Reports Module Functions JavaScript - Fixed Version

// Global variables
let currentLanguage = 'en';
let chartInstances = {};

// Initialize reports module
function initializeReports() {
    console.log('Initializing reports module...');
    
    updateSummaryCards();
    
    // Add delay to ensure DOM is ready for charts
    setTimeout(() => {
        renderOverviewCharts();
        renderFinancialReports();
        renderPayrollReports();
        renderProcurementReports();
        renderAnalytics();
    }, 500);
    
    showNotification('Reports module loaded successfully', 'success');
}

// Update summary cards
function updateSummaryCards() {
    console.log('Updating summary cards...');
    
    // Sample data
    const sampleSummary = {
        totalRevenue: 15000000,
        totalExpenses: 8500000,
        totalPayroll: 4200000,
        outstandingFees: 2300000
    };
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const totalPayrollEl = document.getElementById('totalPayroll');
    const outstandingFeesEl = document.getElementById('outstandingFees');
    
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(sampleSummary.totalRevenue);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(sampleSummary.totalExpenses);
    if (totalPayrollEl) totalPayrollEl.textContent = formatCurrency(sampleSummary.totalPayroll);
    if (outstandingFeesEl) outstandingFeesEl.textContent = formatCurrency(sampleSummary.outstandingFees);
    
    // Update trends
    const revenueTrendEl = document.getElementById('revenueTrend');
    const expensesTrendEl = document.getElementById('expensesTrend');
    const payrollTrendEl = document.getElementById('payrollTrend');
    const outstandingTrendEl = document.getElementById('outstandingTrend');
    
    if (revenueTrendEl) revenueTrendEl.textContent = '+12%';
    if (expensesTrendEl) expensesTrendEl.textContent = '+8%';
    if (payrollTrendEl) payrollTrendEl.textContent = '+3%';
    if (outstandingTrendEl) outstandingTrendEl.textContent = '-5%';
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.closest('.tab-btn').classList.add('active');
    
    // Render specific content based on tab
    switch(tabName) {
        case 'overview':
            renderOverviewCharts();
            break;
        case 'financial':
            renderFinancialReports();
            break;
        case 'payroll':
            renderPayrollReports();
            break;
        case 'procurement':
            renderProcurementReports();
            break;
        case 'analytics':
            renderAnalytics();
            break;
    }
}

// Chart rendering functions
function renderOverviewCharts() {
    renderRevenueChart();
    renderOutstandingChart();
    renderExpenseChart();
    renderUnpaidClassesChart();
}

function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) {
        console.log('Revenue chart canvas not found');
        return;
    }
    
    if (chartInstances.revenue) {
        chartInstances.revenue.destroy();
    }
    
    // Sample data
    const sampleData = [
        { month: 'Jan 2024', value: 2500000 },
        { month: 'Feb 2024', value: 2800000 },
        { month: 'Mar 2024', value: 2200000 },
        { month: 'Apr 2024', value: 3100000 },
        { month: 'May 2024', value: 2900000 },
        { month: 'Jun 2024', value: 3300000 }
    ];
    
    const labels = sampleData.map(item => item.month);
    const data = sampleData.map(item => item.value);
    
    chartInstances.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (TZS)',
                data: data,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'TZS ' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            }
        }
    });
    
    console.log('Revenue chart rendered successfully');
}

function renderOutstandingChart() {
    const ctx = document.getElementById('outstandingChart');
    if (!ctx) {
        console.log('Outstanding chart canvas not found');
        return;
    }
    
    if (chartInstances.outstanding) {
        chartInstances.outstanding.destroy();
    }
    
    // Sample data
    const sampleData = [
        { month: 'Jan 2024', value: 800000 },
        { month: 'Feb 2024', value: 950000 },
        { month: 'Mar 2024', value: 750000 },
        { month: 'Apr 2024', value: 1200000 },
        { month: 'May 2024', value: 900000 },
        { month: 'Jun 2024', value: 1100000 }
    ];
    
    const labels = sampleData.map(item => item.month);
    const data = sampleData.map(item => item.value);
    
    chartInstances.outstanding = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Outstanding Fees',
                data: data,
                backgroundColor: '#f39c12',
                borderColor: '#e67e22',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'TZS ' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            }
        }
    });
    
    console.log('Outstanding chart rendered successfully');
}

function renderExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) {
        console.log('Expense chart canvas not found');
        return;
    }
    
    if (chartInstances.expense) {
        chartInstances.expense.destroy();
    }
    
    // Sample data
    const sampleData = [
        { department: 'Administration', amount: 2500000 },
        { department: 'Science', amount: 1800000 },
        { department: 'Library', amount: 1200000 },
        { department: 'Maintenance', amount: 900000 },
        { department: 'Sports', amount: 600000 }
    ];
    
    const labels = sampleData.map(item => item.department);
    const data = sampleData.map(item => item.amount);
    const colors = ['#4361ee', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6'];
    
    chartInstances.expense = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    console.log('Expense chart rendered successfully');
}

function renderUnpaidClassesChart() {
    const ctx = document.getElementById('unpaidClassesChart');
    if (!ctx) {
        console.log('Unpaid classes chart canvas not found');
        return;
    }
    
    if (chartInstances.unpaidClasses) {
        chartInstances.unpaidClasses.destroy();
    }
    
    // Sample data
    const sampleData = [
        { class: 'Form 4A', amount: 850000 },
        { class: 'Form 3B', amount: 720000 },
        { class: 'Form 2C', amount: 680000 },
        { class: 'Form 1A', amount: 590000 },
        { class: 'Form 4B', amount: 520000 }
    ];
    
    const labels = sampleData.map(item => item.class);
    const data = sampleData.map(item => item.amount);
    
    chartInstances.unpaidClasses = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Outstanding Amount',
                data: data,
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'TZS ' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    console.log('Unpaid classes chart rendered successfully');
}

// Other render functions
function renderFinancialReports() {
    console.log('Rendering financial reports...');
    renderPaymentReports();
}

function renderPaymentReports() {
    console.log('Rendering payment reports...');
    const tbody = document.getElementById('paymentReportsBody');
    if (!tbody) {
        console.log('Payment reports table body not found');
        return;
    }
    
    // Sample data
    const sampleFees = [
        { studentName: 'John Mwalimu', class: 'Form 4', feeType: 'Tuition', amountDue: 450000, amountPaid: 350000, outstanding: 100000, status: 'partial', lastPayment: '2024-02-15' },
        { studentName: 'Mary Kamau', class: 'Form 3', feeType: 'Boarding', amountDue: 300000, amountPaid: 300000, outstanding: 0, status: 'paid', lastPayment: '2024-01-20' },
        { studentName: 'Peter Moshi', class: 'Form 2', feeType: 'Transport', amountDue: 120000, amountPaid: 60000, outstanding: 60000, status: 'partial', lastPayment: '2024-01-10' },
        { studentName: 'Grace Nyongo', class: 'Form 1', feeType: 'Uniform', amountDue: 80000, amountPaid: 0, outstanding: 80000, status: 'unpaid', lastPayment: null }
    ];
    
    tbody.innerHTML = '';
    
    sampleFees.forEach(fee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fee.studentName}</td>
            <td>${fee.class}</td>
            <td>${fee.feeType}</td>
            <td>${formatCurrency(fee.amountDue)}</td>
            <td>${formatCurrency(fee.amountPaid)}</td>
            <td>${formatCurrency(fee.outstanding)}</td>
            <td>${getStatusBadge(fee.status)}</td>
            <td>${formatDate(fee.lastPayment)}</td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Rendered ${sampleFees.length} payment records`);
}

function renderPayrollReports() {
    console.log('Rendering payroll reports...');
    const tbody = document.getElementById('payrollReportsBody');
    if (!tbody) {
        console.log('Payroll reports table body not found');
        return;
    }
    
    // Sample data
    const samplePayroll = [
        { staffName: 'John Kamau', department: 'Teaching', position: 'Math Teacher', baseSalary: 800000, allowances: 150000, deductions: 120000, netSalary: 830000, status: 'paid', paymentDate: '2024-02-28' },
        { staffName: 'Mary Mwalimu', department: 'Administration', position: 'Head Teacher', baseSalary: 1200000, allowances: 300000, deductions: 200000, netSalary: 1300000, status: 'paid', paymentDate: '2024-02-28' }
    ];
    
    tbody.innerHTML = '';
    
    samplePayroll.forEach(payroll => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payroll.staffName}</td>
            <td>${payroll.department}</td>
            <td>${payroll.position}</td>
            <td>${formatCurrency(payroll.baseSalary)}</td>
            <td>${formatCurrency(payroll.allowances)}</td>
            <td>${formatCurrency(payroll.deductions)}</td>
            <td>${formatCurrency(payroll.netSalary)}</td>
            <td>${getStatusBadge(payroll.status)}</td>
            <td>${formatDate(payroll.paymentDate)}</td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Rendered ${samplePayroll.length} payroll records`);
}

function renderProcurementReports() {
    console.log('Rendering procurement reports...');
}

function renderAnalytics() {
    console.log('Rendering analytics...');
}

// Utility functions
function formatCurrency(amount) {
    if (!amount) return 'TZS 0';
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

// Notification system
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        console.log('Notification:', message);
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Translation system
const translations = {
    en: {
        // Header
        'dashboard': 'Dashboard',
        'students': 'Students',
        'fees_payments': 'Fees & Payments',
        'staff_payroll': 'Staff & Payroll',
        'procurement': 'Procurement',
        'reports': 'Reports & Analytics',
        'settings': 'Settings',
        'logout': 'Logout',
        
        // Main content
        'reports_analytics': 'Reports & Analytics',
        'total_revenue': 'Total Revenue',
        'total_expenses': 'Total Expenses', 
        'total_payroll': 'Total Payroll',
        'outstanding_fees': 'Outstanding Fees',
        'overview': 'Overview',
        'financial': 'Financial',
        'payroll': 'Payroll',
        'analytics': 'Analytics',
        'monthly_revenue': 'Monthly Revenue Trend',
        'outstanding_over_time': 'Outstanding Fees Over Time',
        'expense_breakdown': 'Expense Breakdown by Department',
        'top_unpaid_classes': 'Top Classes with Unpaid Fees',
        'export': 'Export',
        'filter': 'Filter'
    },
    sw: {
        // Header
        'dashboard': 'Dashibodi',
        'students': 'Wanafunzi',
        'fees_payments': 'Ada na Malipo',
        'staff_payroll': 'Wafanyakazi na Mishahara',
        'procurement': 'Ununuzi',
        'reports': 'Ripoti na Takwimu',
        'settings': 'Mipangilio',
        'logout': 'Ondoka',
        
        // Main content
        'reports_analytics': 'Ripoti na Takwimu',
        'total_revenue': 'Mapato Yote',
        'total_expenses': 'Matumizi Yote',
        'total_payroll': 'Mishahara Yote',
        'outstanding_fees': 'Ada Zilizobaki',
        'overview': 'Muhtasari',
        'financial': 'Kifedha',
        'payroll': 'Mishahara',
        'analytics': 'Takwimu',
        'monthly_revenue': 'Mwelekeo wa Mapato ya Kila Mwezi',
        'outstanding_over_time': 'Ada Zilizobaki Kwa Muda',
        'expense_breakdown': 'Mgawanyo wa Matumizi kwa Idara',
        'top_unpaid_classes': 'Madarasa Yenye Ada Nyingi Zilizobaki',
        'export': 'Hamisha',
        'filter': 'Chuja'
    }
};

function applyTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// Export functions to global scope
window.initializeReports = initializeReports;
window.updateSummaryCards = updateSummaryCards;
window.switchTab = switchTab;
window.renderOverviewCharts = renderOverviewCharts;
window.renderFinancialReports = renderFinancialReports;
window.renderPayrollReports = renderPayrollReports;
window.renderProcurementReports = renderProcurementReports;
window.renderAnalytics = renderAnalytics;
window.showNotification = showNotification;
window.applyTranslations = applyTranslations;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getStatusBadge = getStatusBadge;
window.currentLanguage = currentLanguage;
window.chartInstances = chartInstances;
