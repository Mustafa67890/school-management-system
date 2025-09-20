// Reports Module Functions JavaScript

// Initialize reports module
function initializeReports() {
    console.log('Initializing reports module...');
    
    // Make sure data is initialized first
    if (typeof initializeReportsData === 'function') {
        initializeReportsData();
    } else {
        console.error('initializeReportsData function not found');
        return;
    }
    
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
    const summary = reportsData.summary;
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const totalPayrollEl = document.getElementById('totalPayroll');
    const outstandingFeesEl = document.getElementById('outstandingFees');
    
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(summary.fees.totalRevenue);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(summary.procurement.totalSpent);
    if (totalPayrollEl) totalPayrollEl.textContent = formatCurrency(summary.payroll.totalPayroll);
    if (outstandingFeesEl) outstandingFeesEl.textContent = formatCurrency(summary.fees.totalOutstanding);
    
    // Update trends (placeholder calculations)
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
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
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
    
    if (window.chartInstances && window.chartInstances.revenue) {
        window.chartInstances.revenue.destroy();
    }
    
    // Sample data if no real data available
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
    
    if (!window.chartInstances) window.chartInstances = {};
    
    window.chartInstances.revenue = new Chart(ctx, {
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderOutstandingChart() {
    const ctx = document.getElementById('outstandingChart');
    if (!ctx) return;
    
    if (chartInstances.outstanding) {
        chartInstances.outstanding.destroy();
    }
    
    const classOutstanding = {};
    reportsData.fees.forEach(fee => {
        if (!classOutstanding[fee.class]) {
            classOutstanding[fee.class] = 0;
        }
        classOutstanding[fee.class] += fee.outstanding;
    });
    
    chartInstances.outstanding = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(classOutstanding),
            datasets: [{
                label: 'Outstanding Fees',
                data: Object.values(classOutstanding),
                backgroundColor: chartColors.warning,
                borderColor: chartColors.warning,
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    
    if (chartInstances.expense) {
        chartInstances.expense.destroy();
    }
    
    const departmentExpenses = {};
    reportsData.procurement.forEach(proc => {
        if (!departmentExpenses[proc.department]) {
            departmentExpenses[proc.department] = 0;
        }
        departmentExpenses[proc.department] += proc.amountSpent;
    });
    
    chartInstances.expense = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(departmentExpenses),
            datasets: [{
                data: Object.values(departmentExpenses),
                backgroundColor: chartColorPalette.slice(0, Object.keys(departmentExpenses).length)
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
}

function renderUnpaidClassesChart() {
    const ctx = document.getElementById('unpaidClassesChart');
    if (!ctx) return;
    
    if (chartInstances.unpaidClasses) {
        chartInstances.unpaidClasses.destroy();
    }
    
    const classUnpaid = {};
    reportsData.fees.filter(fee => fee.outstanding > 0).forEach(fee => {
        if (!classUnpaid[fee.class]) {
            classUnpaid[fee.class] = 0;
        }
        classUnpaid[fee.class] += fee.outstanding;
    });
    
    const sortedClasses = Object.entries(classUnpaid)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    chartInstances.unpaidClasses = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedClasses.map(([className]) => className),
            datasets: [{
                label: 'Outstanding Amount',
                data: sortedClasses.map(([, amount]) => amount),
                backgroundColor: chartColors.danger,
                borderColor: chartColors.danger,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Report rendering functions
function renderPaymentReports() {
    console.log('Rendering payment reports...');
    const tbody = document.getElementById('paymentReportsBody');
    if (!tbody) {
        console.log('Payment reports table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    reportsData.fees.forEach(fee => {
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
    
    console.log(`Rendered ${reportsData.fees.length} payment records`);
}

function renderFinancialReports() {
    renderPaymentReports();
    renderMonthlyFeeChart();
    renderFeeTypeChart();
}

function renderMonthlyFeeChart() {
    const ctx = document.getElementById('monthlyFeeChart');
    if (!ctx) return;
    
    if (chartInstances.monthlyFee) {
        chartInstances.monthlyFee.destroy();
    }
    
    const monthlyFees = generateMonthlyData(reportsData.fees, 'lastPayment', 'amountPaid');
    const labels = Object.keys(monthlyFees).sort();
    const data = labels.map(label => monthlyFees[label]);
    
    chartInstances.monthlyFee = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(label => {
                const [year, month] = label.split('-');
                return getMonthName(parseInt(month)) + ' ' + year;
            }),
            datasets: [{
                label: 'Fee Collection',
                data: data,
                borderColor: chartColors.success,
                backgroundColor: chartColors.success + '20',
                tension: 0.4,
                fill: true
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderFeeTypeChart() {
    const ctx = document.getElementById('feeTypeChart');
    if (!ctx) return;
    
    if (chartInstances.feeType) {
        chartInstances.feeType.destroy();
    }
    
    const feeTypeData = {};
    reportsData.fees.forEach(fee => {
        if (!feeTypeData[fee.feeType]) {
            feeTypeData[fee.feeType] = 0;
        }
        feeTypeData[fee.feeType] += fee.amountPaid;
    });
    
    chartInstances.feeType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(feeTypeData),
            datasets: [{
                data: Object.values(feeTypeData),
                backgroundColor: chartColorPalette.slice(0, Object.keys(feeTypeData).length)
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
}

function renderPayrollReports() {
    console.log('Rendering payroll reports...');
    const tbody = document.getElementById('payrollReportsBody');
    if (!tbody) {
        console.log('Payroll reports table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    reportsData.payroll.forEach(payroll => {
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
    
    console.log(`Rendered ${reportsData.payroll.length} payroll records`);
    renderMonthlySalaryChart();
    renderDepartmentCostChart();
}

function renderMonthlySalaryChart() {
    const ctx = document.getElementById('monthlySalaryChart');
    if (!ctx) return;
    
    if (chartInstances.monthlySalary) {
        chartInstances.monthlySalary.destroy();
    }
    
    const monthlyPayroll = generateMonthlyData(reportsData.payroll, 'paymentDate', 'netSalary');
    const labels = Object.keys(monthlyPayroll).sort();
    const data = labels.map(label => monthlyPayroll[label]);
    
    chartInstances.monthlySalary = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(label => {
                const [year, month] = label.split('-');
                return getMonthName(parseInt(month)) + ' ' + year;
            }),
            datasets: [{
                label: 'Monthly Salary Cost',
                data: data,
                backgroundColor: chartColors.secondary,
                borderColor: chartColors.secondary,
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderDepartmentCostChart() {
    const ctx = document.getElementById('departmentCostChart');
    if (!ctx) return;
    
    if (chartInstances.departmentCost) {
        chartInstances.departmentCost.destroy();
    }
    
    const departmentCosts = {};
    reportsData.payroll.forEach(payroll => {
        if (!departmentCosts[payroll.department]) {
            departmentCosts[payroll.department] = 0;
        }
        departmentCosts[payroll.department] += payroll.netSalary;
    });
    
    chartInstances.departmentCost = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(departmentCosts),
            datasets: [{
                data: Object.values(departmentCosts),
                backgroundColor: chartColorPalette.slice(0, Object.keys(departmentCosts).length)
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
}

function renderProcurementReports() {
    const tbody = document.getElementById('procurementReportsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    reportsData.procurement.forEach(proc => {
        const row = document.createElement('tr');
        const varianceClass = proc.variance >= 0 ? 'positive' : 'negative';
        row.innerHTML = `
            <td>${proc.poNumber}</td>
            <td>${proc.supplier}</td>
            <td>${proc.department}</td>
            <td>${proc.items}</td>
            <td>${formatCurrency(proc.budgetAllocated)}</td>
            <td>${formatCurrency(proc.amountSpent)}</td>
            <td class="${varianceClass}">${formatCurrency(proc.variance)}</td>
            <td>${getStatusBadge(proc.status)}</td>
            <td>${formatDate(proc.date)}</td>
        `;
        tbody.appendChild(row);
    });
    
    renderBudgetVarianceChart();
    renderSupplierPerformanceChart();
}

function renderBudgetVarianceChart() {
    const ctx = document.getElementById('budgetVarianceChart');
    if (!ctx) return;
    
    if (chartInstances.budgetVariance) {
        chartInstances.budgetVariance.destroy();
    }
    
    const departments = [...new Set(reportsData.procurement.map(p => p.department))];
    const budgetData = departments.map(dept => {
        const deptData = reportsData.procurement.filter(p => p.department === dept);
        return deptData.reduce((sum, p) => sum + p.budgetAllocated, 0);
    });
    const actualData = departments.map(dept => {
        const deptData = reportsData.procurement.filter(p => p.department === dept);
        return deptData.reduce((sum, p) => sum + p.amountSpent, 0);
    });
    
    chartInstances.budgetVariance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: departments,
            datasets: [{
                label: 'Budget Allocated',
                data: budgetData,
                backgroundColor: chartColors.primary,
                borderColor: chartColors.primary,
                borderWidth: 1
            }, {
                label: 'Amount Spent',
                data: actualData,
                backgroundColor: chartColors.warning,
                borderColor: chartColors.warning,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderSupplierPerformanceChart() {
    const ctx = document.getElementById('supplierPerformanceChart');
    if (!ctx) return;
    
    if (chartInstances.supplierPerformance) {
        chartInstances.supplierPerformance.destroy();
    }
    
    const supplierData = {};
    reportsData.procurement.forEach(proc => {
        if (!supplierData[proc.supplier]) {
            supplierData[proc.supplier] = 0;
        }
        supplierData[proc.supplier] += proc.amountSpent;
    });
    
    chartInstances.supplierPerformance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(supplierData),
            datasets: [{
                data: Object.values(supplierData),
                backgroundColor: chartColorPalette.slice(0, Object.keys(supplierData).length)
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
}

function renderAnalytics() {
    renderTrendAnalysisChart();
    renderComparativeChart();
    renderForecastChart();
    updateKPIs();
}

function renderTrendAnalysisChart() {
    const ctx = document.getElementById('trendAnalysisChart');
    if (!ctx) return;
    
    if (chartInstances.trendAnalysis) {
        chartInstances.trendAnalysis.destroy();
    }
    
    const monthlyRevenue = generateMonthlyData(reportsData.fees, 'lastPayment', 'amountPaid');
    const monthlyExpenses = generateMonthlyData(reportsData.procurement, 'date', 'amountSpent');
    const monthlyPayroll = generateMonthlyData(reportsData.payroll, 'paymentDate', 'netSalary');
    
    const allMonths = [...new Set([
        ...Object.keys(monthlyRevenue),
        ...Object.keys(monthlyExpenses),
        ...Object.keys(monthlyPayroll)
    ])].sort();
    
    chartInstances.trendAnalysis = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allMonths.map(month => {
                const [year, m] = month.split('-');
                return getMonthName(parseInt(m)) + ' ' + year;
            }),
            datasets: [{
                label: 'Revenue',
                data: allMonths.map(month => monthlyRevenue[month] || 0),
                borderColor: chartColors.success,
                backgroundColor: chartColors.success + '20',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: allMonths.map(month => monthlyExpenses[month] || 0),
                borderColor: chartColors.danger,
                backgroundColor: chartColors.danger + '20',
                tension: 0.4
            }, {
                label: 'Payroll',
                data: allMonths.map(month => monthlyPayroll[month] || 0),
                borderColor: chartColors.secondary,
                backgroundColor: chartColors.secondary + '20',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderComparativeChart() {
    const ctx = document.getElementById('comparativeChart');
    if (!ctx) return;
    
    if (chartInstances.comparative) {
        chartInstances.comparative.destroy();
    }
    
    const summary = reportsData.summary;
    
    chartInstances.comparative = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Revenue', 'Expenses', 'Payroll', 'Outstanding'],
            datasets: [{
                label: 'Amount (TZS)',
                data: [
                    summary.fees.totalRevenue,
                    summary.procurement.totalSpent,
                    summary.payroll.totalPayroll,
                    summary.fees.totalOutstanding
                ],
                backgroundColor: [
                    chartColors.success,
                    chartColors.danger,
                    chartColors.secondary,
                    chartColors.warning
                ]
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderForecastChart() {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;
    
    if (chartInstances.forecast) {
        chartInstances.forecast.destroy();
    }
    
    // Simple forecast based on current trends
    const monthlyRevenue = generateMonthlyData(reportsData.fees, 'lastPayment', 'amountPaid');
    const currentMonths = Object.keys(monthlyRevenue).sort();
    const avgRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0) / Object.keys(monthlyRevenue).length;
    
    // Generate next 6 months forecast
    const forecastMonths = [];
    const forecastData = [];
    const lastMonth = new Date(currentMonths[currentMonths.length - 1] + '-01');
    
    for (let i = 1; i <= 6; i++) {
        const nextMonth = new Date(lastMonth);
        nextMonth.setMonth(nextMonth.getMonth() + i);
        const monthKey = nextMonth.toISOString().slice(0, 7);
        forecastMonths.push(getMonthName(nextMonth.getMonth() + 1) + ' ' + nextMonth.getFullYear());
        forecastData.push(avgRevenue * (1 + (Math.random() - 0.5) * 0.2)); // ±10% variation
    }
    
    chartInstances.forecast = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastMonths,
            datasets: [{
                label: 'Projected Revenue',
                data: forecastData,
                borderColor: chartColors.info,
                backgroundColor: chartColors.info + '20',
                borderDash: [5, 5],
                tension: 0.4,
                fill: true
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateKPIs() {
    const summary = reportsData.summary;
    
    document.getElementById('feeCollectionRate').textContent = summary.fees.collectionRate + '%';
    document.getElementById('budgetUtilization').textContent = summary.procurement.utilizationRate + '%';
    document.getElementById('staffCostRatio').textContent = 
        calculatePercentage(summary.payroll.totalPayroll, summary.fees.totalRevenue) + '%';
    document.getElementById('outstandingFeesKpi').textContent = summary.fees.outstandingRate + '%';
}

// Export functions
function exportPaymentReport() {
    const data = reportsData.fees.map(fee => ({
        'Student Name': fee.studentName,
        'Class': fee.class,
        'Fee Type': fee.feeType,
        'Amount Due': fee.amountDue,
        'Amount Paid': fee.amountPaid,
        'Outstanding': fee.outstanding,
        'Last Payment': fee.lastPayment,
        'Status': fee.status
    }));
    
    exportToCSV(data, 'payment-report');
}

function exportPayrollReport() {
    const data = reportsData.payroll.map(payroll => ({
        'Staff Name': payroll.staffName,
        'Department': payroll.department,
        'Position': payroll.position,
        'Base Salary': payroll.baseSalary,
        'Allowances': payroll.allowances,
        'Deductions': payroll.deductions,
        'Net Salary': payroll.netSalary,
        'Payment Date': payroll.paymentDate
    }));
    
    exportToCSV(data, 'payroll-report');
}

function exportProcurementReport() {
    const data = reportsData.procurement.map(proc => ({
        'PO Number': proc.poNumber,
        'Supplier': proc.supplier,
        'Department': proc.department,
        'Items': proc.items,
        'Budget Allocated': proc.budgetAllocated,
        'Amount Spent': proc.amountSpent,
        'Variance': proc.variance,
        'Status': proc.status,
        'Date': proc.date
    }));
    
    exportToCSV(data, 'procurement-report');
}

function exportToCSV(data, filename) {
    const csv = convertToCSV(data);
    downloadCSV(csv, filename + '.csv');
    showNotification('Report exported successfully', 'success');
}

function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Filter functions
function filterPaymentReports() {
    const classFilter = document.getElementById('paymentClassFilter').value;
    const typeFilter = document.getElementById('paymentTypeFilter').value;
    
    let filteredData = reportsData.fees;
    
    if (classFilter) {
        filteredData = filteredData.filter(fee => fee.class === classFilter);
    }
    
    if (typeFilter) {
        filteredData = filteredData.filter(fee => fee.feeType === typeFilter);
    }
    
    renderFilteredPaymentReports(filteredData);
}

function renderFilteredPaymentReports(data) {
    const tbody = document.getElementById('paymentReportsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(fee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fee.studentName}</td>
            <td>${fee.class}</td>
            <td>${fee.feeType}</td>
            <td>${formatCurrency(fee.amountDue)}</td>
            <td>${formatCurrency(fee.amountPaid)}</td>
            <td>${formatCurrency(fee.outstanding)}</td>
            <td>${formatDate(fee.lastPayment)}</td>
            <td>${getStatusBadge(fee.status)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update reports based on date range
function updateReports() {
    const startDate = document.getElementById('dateRangeStart').value;
    const endDate = document.getElementById('dateRangeEnd').value;
    
    currentDateRange.start = startDate;
    currentDateRange.end = endDate;
    
    // Re-render all reports with new date range
    updateSummaryCards();
    renderOverviewCharts();
    renderPaymentReports();
    renderPayrollReports();
    renderProcurementReports();
    
    showNotification('Reports updated for selected date range', 'info');
}

// Refresh all data
function refreshAllData() {
    initializeReportsData();
    updateSummaryCards();
    renderOverviewCharts();
    renderPaymentReports();
    renderPayrollReports();
    renderProcurementReports();
    showNotification('All data refreshed successfully', 'success');
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

// Add missing chart rendering functions
function renderOutstandingChart() {
    const ctx = document.getElementById('outstandingChart');
    if (!ctx) {
        console.log('Outstanding chart canvas not found');
        return;
    }
    
    if (chartInstances.outstanding) {
        chartInstances.outstanding.destroy();
    }
    
    const monthlyOutstanding = generateMonthlyData(reportsData.fees, 'lastPayment', 'outstanding');
    const labels = Object.keys(monthlyOutstanding).sort();
    const data = labels.map(label => monthlyOutstanding[label]);
    
    chartInstances.outstanding = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(label => {
                const [year, month] = label.split('-');
                return getMonthName(parseInt(month)) + ' ' + year;
            }),
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
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
    
    const departmentExpenses = {};
    reportsData.procurement.forEach(item => {
        if (!departmentExpenses[item.department]) {
            departmentExpenses[item.department] = 0;
        }
        departmentExpenses[item.department] += item.amountSpent;
    });
    
    const labels = Object.keys(departmentExpenses);
    const data = Object.values(departmentExpenses);
    const colors = ['#4361ee', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6'];
    
    chartInstances.expense = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
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
    
    const classOutstanding = {};
    reportsData.fees.forEach(fee => {
        if (fee.outstanding > 0) {
            if (!classOutstanding[fee.class]) {
                classOutstanding[fee.class] = 0;
            }
            classOutstanding[fee.class] += fee.outstanding;
        }
    });
    
    const sortedClasses = Object.entries(classOutstanding)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const labels = sortedClasses.map(([className]) => className);
    const data = sortedClasses.map(([,amount]) => amount);
    
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
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Switch report type
function switchReportType() {
    const reportType = document.getElementById('reportType').value;
    
    switch(reportType) {
        case 'financial':
            switchTab('financial');
            break;
        case 'payroll':
            switchTab('payroll');
            break;
        case 'procurement':
            switchTab('procurement');
            break;
        case 'students':
            switchTab('financial');
            break;
        default:
            switchTab('overview');
    }
}

// Export all reports
function exportAllReports() {
    openModal('exportModal');
}

function performExport() {
    const format = document.getElementById('exportFormat').value;
    const reportType = document.getElementById('exportReportType').value;
    const includeCharts = document.getElementById('includeCharts').checked;
    
    switch(reportType) {
        case 'payment':
            exportPaymentReport();
            break;
        case 'payroll':
            exportPayrollReport();
            break;
        case 'procurement':
            exportProcurementReport();
            break;
        case 'summary':
            exportSummaryReport();
            break;
    }
    
    closeModal('exportModal');
}

function exportSummaryReport() {
    const summary = reportsData.summary;
    const data = [{
        'Report Type': 'Summary',
        'Total Revenue': summary.fees.totalRevenue,
        'Total Expenses': summary.procurement.totalSpent,
        'Total Payroll': summary.payroll.totalPayroll,
        'Outstanding Fees': summary.fees.totalOutstanding,
        'Collection Rate': summary.fees.collectionRate + '%',
        'Budget Utilization': summary.procurement.utilizationRate + '%'
    }];
    
    exportToCSV(data, 'summary-report');
}
