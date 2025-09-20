// Procurement Module Functions JavaScript

// Logout function for procurement module
function confirmLogout() {
    closeModal('logoutModal');
    if (window.authManager) {
        window.authManager.logout();
    } else {
        // Fallback if authManager not available
        localStorage.removeItem('sms_session');
        localStorage.removeItem('sms_user');
        window.location.href = '../login.html';
    }
}

// Goods Receiving Functions
function updateReceivingCards() {
    const data = procurementData.goodsReceiving;
    
    // Calculate statistics
    const pendingDeliveries = data.filter(item => item.status === 'pending').length;
    const receivedToday = data.filter(item => {
        const today = new Date().toISOString().split('T')[0];
        return item.date === today && item.status === 'complete';
    }).length;
    const partialDeliveries = data.filter(item => item.status === 'partial').length;
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    
    // Update card values
    document.getElementById('cardPendingDeliveries').textContent = pendingDeliveries;
    document.getElementById('cardReceivedToday').textContent = receivedToday;
    document.getElementById('cardPartialDeliveries').textContent = partialDeliveries;
    document.getElementById('cardTotalValue').textContent = formatCurrency(totalValue);
}

function renderReceivingTable() {
    const tbody = document.getElementById('receivingTableBody');
    const data = procurementData.goodsReceiving;
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${item.id}" onchange="toggleDeleteButton('receiving')"></td>
            <td>${item.poNumber}</td>
            <td>${item.supplier}</td>
            <td>${getDepartmentName(item.department)}</td>
            <td>${item.items}</td>
            <td>${item.expected}</td>
            <td>${item.received}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>${formatDate(item.date)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewReceivingDetails(${item.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editReceiving(${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteReceiving(${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn print" onclick="printReceivingReceipt(${item.id})" title="Print Receipt">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterReceiving() {
    const statusFilter = document.getElementById('filterStatus').value;
    const departmentFilter = document.getElementById('filterDepartment').value;
    const searchTerm = document.getElementById('searchReceiving').value.toLowerCase();
    
    let filteredData = procurementData.goodsReceiving;
    
    if (statusFilter) {
        filteredData = filteredData.filter(item => item.status === statusFilter);
    }
    
    if (departmentFilter) {
        filteredData = filteredData.filter(item => item.department === departmentFilter);
    }
    
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.poNumber.toLowerCase().includes(searchTerm) ||
            item.supplier.toLowerCase().includes(searchTerm)
        );
    }
    
    renderFilteredReceivingTable(filteredData);
}

function renderFilteredReceivingTable(data) {
    const tbody = document.getElementById('receivingTableBody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.poNumber}</td>
            <td>${item.supplier}</td>
            <td>${getDepartmentName(item.department)}</td>
            <td>${item.items}</td>
            <td>${item.expected}</td>
            <td>${item.received}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>${formatDate(item.date)}</td>
            <td>
                <button class="btn btn-outline" onclick="viewReceivingDetails(${item.id})" style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-primary" onclick="editReceiving(${item.id})" style="padding: 6px 12px; font-size: 12px;">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveGoodsReceipt() {
    const poNumber = document.getElementById('receiptPONumber').value;
    const supplier = document.getElementById('receiptSupplier').value;
    const department = document.getElementById('receiptDepartment').value;
    const items = document.getElementById('receiptItems').value;
    const expected = parseInt(document.getElementById('receiptExpected').value);
    const received = parseInt(document.getElementById('receiptReceived').value);
    const date = document.getElementById('receiptDate').value;
    const notes = document.getElementById('receiptNotes').value;
    
    if (!poNumber || !supplier || !department || !items || !expected || !received) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const status = received === expected ? 'complete' : (received > 0 ? 'partial' : 'pending');
    
    const newReceipt = {
        id: procurementData.goodsReceiving.length + 1,
        poNumber,
        supplier,
        department,
        items,
        expected,
        received,
        status,
        date,
        notes,
        value: expected * 1000 // Estimated value
    };
    
    procurementData.goodsReceiving.push(newReceipt);
    
    updateReceivingCards();
    renderReceivingTable();
    closeModal('receiveGoodsModal');
    
    showNotification('Goods receipt saved successfully', 'success');
}

function createPurchaseOrder() {
    const poNumber = document.getElementById('newPONumber').value;
    const department = document.getElementById('newPODepartment').value;
    const supplier = document.getElementById('newPOSupplier').value;
    const delivery = document.getElementById('newPODelivery').value;
    const items = document.getElementById('newPOItems').value;
    const value = parseInt(document.getElementById('newPOValue').value);
    const priority = document.getElementById('newPOPriority').value;
    
    if (!department || !supplier || !items || !value) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const newOrder = {
        id: procurementData.goodsReceiving.length + 1,
        poNumber,
        supplier,
        department,
        items,
        expected: 0,
        received: 0,
        status: 'pending',
        date: delivery,
        value,
        priority
    };
    
    procurementData.goodsReceiving.push(newOrder);
    
    updateReceivingCards();
    renderReceivingTable();
    closeModal('newOrderModal');
    
    showNotification('Purchase order created successfully', 'success');
}

// Invoice Processing Functions
function updateInvoiceCards() {
    const data = procurementData.invoices;
    
    const pendingInvoices = data.filter(item => item.status === 'pending').length;
    const approvedPayments = data.filter(item => item.status === 'approved').length;
    const paidThisMonth = data.filter(item => {
        const currentMonth = new Date().getMonth();
        const itemMonth = new Date(item.date).getMonth();
        return item.status === 'paid' && itemMonth === currentMonth;
    }).reduce((sum, item) => sum + item.amount, 0);
    const outstanding = data.filter(item => item.status !== 'paid').reduce((sum, item) => sum + item.amount, 0);
    
    document.getElementById('cardPendingInvoices').textContent = pendingInvoices;
    document.getElementById('cardApprovedPayments').textContent = approvedPayments;
    document.getElementById('cardPaidMonth').textContent = formatCurrency(paidThisMonth);
    document.getElementById('cardOutstanding').textContent = formatCurrency(outstanding);
}

function renderInvoiceTable() {
    const tbody = document.getElementById('invoicesTableBody');
    const data = procurementData.invoices;
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${item.id}" onchange="toggleDeleteButton('invoices')"></td>
            <td>${item.invoiceNumber}</td>
            <td>${item.supplier}</td>
            <td>${item.poReference}</td>
            <td>${formatCurrency(item.amount)}</td>
            <td>${formatDate(item.dueDate)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>${item.paymentMethod.toUpperCase()}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewInvoiceDetails(${item.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editInvoice(${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteInvoice(${item.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn print" onclick="printInvoiceReceipt(${item.id})" title="Print Receipt">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveInvoice() {
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const poRef = document.getElementById('invoicePORef').value;
    const supplier = document.getElementById('invoiceSupplier').value;
    const amount = parseInt(document.getElementById('invoiceAmount').value);
    const dueDate = document.getElementById('invoiceDueDate').value;
    const paymentMethod = document.getElementById('invoicePaymentMethod').value;
    const status = document.getElementById('invoiceStatus').value;
    const date = document.getElementById('invoiceDate').value;
    const notes = document.getElementById('invoiceNotes').value;
    
    if (!invoiceNumber || !poRef || !amount || !dueDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const newInvoice = {
        id: procurementData.invoices.length + 1,
        invoiceNumber,
        supplier: supplier || 'Unknown Supplier',
        poReference: poRef,
        amount,
        dueDate,
        status,
        paymentMethod,
        date,
        notes
    };
    
    procurementData.invoices.push(newInvoice);
    
    updateInvoiceCards();
    renderInvoicesTable();
    closeModal('processInvoiceModal');
    
    showNotification('Invoice processed successfully', 'success');
}

function processPayment(invoiceId) {
    const invoice = procurementData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        invoice.status = 'paid';
        updateInvoiceCards();
        renderInvoicesTable();
        showNotification(`Payment processed for ${invoice.invoiceNumber}`, 'success');
    }
}

function processPayments() {
    const approvedInvoices = procurementData.invoices.filter(inv => inv.status === 'approved');
    
    if (approvedInvoices.length === 0) {
        showNotification('No approved invoices to process', 'warning');
        return;
    }
    
    approvedInvoices.forEach(invoice => {
        invoice.status = 'paid';
    });
    
    updateInvoiceCards();
    renderInvoicesTable();
    showNotification(`${approvedInvoices.length} payments processed successfully`, 'success');
}

// Budget Control Functions
function updateBudgetCards() {
    const data = procurementData.budgets;
    
    const totalBudget = data.reduce((sum, item) => sum + item.annual, 0);
    const totalUtilized = data.reduce((sum, item) => sum + item.utilized, 0);
    const totalRemaining = data.reduce((sum, item) => sum + item.remaining, 0);
    const overBudgetDepts = data.filter(item => item.remaining < 0).length;
    
    document.getElementById('cardTotalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('cardUtilized').textContent = formatCurrency(totalUtilized);
    document.getElementById('cardRemaining').textContent = formatCurrency(totalRemaining);
    document.getElementById('cardOverBudget').textContent = overBudgetDepts;
}

let budgetChartInstance = null;

function renderBudgetChart() {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    
    // Destroy existing chart to prevent continuous generation
    if (budgetChartInstance) {
        budgetChartInstance.destroy();
    }
    
    const data = procurementData.budgets;
    
    budgetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => item.utilized),
                backgroundColor: [
                    '#4361ee',
                    '#f39c12',
                    '#2ecc71',
                    '#e74c3c'
                ],
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

function renderBudgetItems() {
    const container = document.getElementById('budgetItems');
    if (!container) return;
    
    const data = procurementData.budgets;
    
    container.innerHTML = '';
    
    data.forEach(item => {
        const percentage = (item.utilized / item.annual) * 100;
        const isOverBudget = item.remaining < 0;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = `budget-item ${isOverBudget ? 'over-budget' : ''}`;
        budgetItem.innerHTML = `
            <div class="budget-item-info">
                <h4>${item.name}</h4>
                <p>${formatCurrency(item.utilized)} / ${formatCurrency(item.annual)} (${percentage.toFixed(1)}%)</p>
            </div>
            <div class="budget-progress">
                <div class="budget-progress-bar ${isOverBudget ? 'over' : ''}" 
                     style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
        `;
        
        container.appendChild(budgetItem);
    });
}

// Reports Functions
function renderReportsCharts() {
    renderProcurementTrendChart();
    renderSuppliersChart();
}

function renderProcurementTrendChart() {
    const ctx = document.getElementById('procurementTrendChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Procurement (TZS)',
                data: [450000, 850000, 600000, 720000, 920000, 680000],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true
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

function renderSuppliersChart() {
    const ctx = document.getElementById('suppliersChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Stationery Plus', 'Science Equipment Co', 'Library Books', 'Maintenance Supplies'],
            datasets: [{
                label: 'Total Value (TZS)',
                data: [450000, 850000, 600000, 320000],
                backgroundColor: [
                    '#4361ee',
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c'
                ]
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

function generateReport(reportType) {
    let reportContent = '';
    let reportTitle = '';
    
    switch(reportType) {
        case 'monthly':
            reportTitle = 'Monthly Procurement Report';
            reportContent = generateMonthlyReport();
            break;
        case 'department':
            reportTitle = 'Department Spending Report';
            reportContent = generateDepartmentReport();
            break;
        case 'supplier':
            reportTitle = 'Supplier Performance Report';
            reportContent = generateSupplierReport();
            break;
        case 'budget':
            reportTitle = 'Budget vs Actual Report';
            reportContent = generateBudgetReport();
            break;
    }
    
    document.getElementById('reportPreviewTitle').textContent = reportTitle;
    document.getElementById('reportPreviewBody').innerHTML = reportContent;
    openModal('reportPreviewModal');
}

function generateMonthlyReport() {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    return `
        <div class="report-content">
            <h3>Procurement Summary for ${currentMonth}</h3>
            <div class="report-section">
                <h4>Total Procurement Value: ${formatCurrency(2450000)}</h4>
                <h4>Number of Orders: ${procurementData.goodsReceiving.length}</h4>
                <h4>Suppliers Engaged: 4</h4>
            </div>
            <div class="report-section">
                <h4>Department Breakdown:</h4>
                <ul>
                    <li>Science Department: ${formatCurrency(850000)}</li>
                    <li>Library: ${formatCurrency(600000)}</li>
                    <li>Administration: ${formatCurrency(450000)}</li>
                    <li>Maintenance: ${formatCurrency(550000)}</li>
                </ul>
            </div>
            <div class="report-section">
                <h4>Top Items Procured:</h4>
                <ul>
                    <li>Stationery: 200 exercise books, 100 pens, 50 chalk boxes</li>
                    <li>Science Equipment: 5 microscopes, 200 test tubes</li>
                    <li>Library Books: 150 textbooks, 50 reference books</li>
                </ul>
            </div>
        </div>
    `;
}

function generateDepartmentReport() {
    return `
        <div class="report-content">
            <h3>Department Spending Analysis</h3>
            <div class="report-section">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #ddd;">Department</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Budget</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Utilized</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Remaining</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">% Used</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${procurementData.budgets.map(dept => `
                            <tr>
                                <td style="padding: 12px; border: 1px solid #ddd;">${dept.name}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${formatCurrency(dept.annual)}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${formatCurrency(dept.utilized)}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${formatCurrency(dept.remaining)}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${((dept.utilized / dept.annual) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateSupplierReport() {
    return `
        <div class="report-content">
            <h3>Supplier Performance Analysis</h3>
            <div class="report-section">
                <h4>Supplier Rankings by Value:</h4>
                <ol>
                    <li>Science Equipment Co - ${formatCurrency(850000)} (Average delivery: 5 days)</li>
                    <li>Library Books Suppliers - ${formatCurrency(600000)} (Average delivery: 7 days)</li>
                    <li>Stationery Plus Ltd - ${formatCurrency(450000)} (Average delivery: 3 days)</li>
                    <li>Maintenance Supplies - ${formatCurrency(320000)} (Average delivery: 4 days)</li>
                </ol>
            </div>
            <div class="report-section">
                <h4>Delivery Performance:</h4>
                <ul>
                    <li>On-time deliveries: 85%</li>
                    <li>Partial deliveries: 10%</li>
                    <li>Late deliveries: 5%</li>
                </ul>
            </div>
        </div>
    `;
}

function generateBudgetReport() {
    const totalBudget = procurementData.budgets.reduce((sum, item) => sum + item.annual, 0);
    const totalUtilized = procurementData.budgets.reduce((sum, item) => sum + item.utilized, 0);
    
    return `
        <div class="report-content">
            <h3>Budget vs Actual Spending Report</h3>
            <div class="report-section">
                <h4>Overall Performance:</h4>
                <p>Total Budget: ${formatCurrency(totalBudget)}</p>
                <p>Total Utilized: ${formatCurrency(totalUtilized)}</p>
                <p>Utilization Rate: ${((totalUtilized / totalBudget) * 100).toFixed(1)}%</p>
            </div>
            <div class="report-section">
                <h4>Department Performance:</h4>
                ${procurementData.budgets.map(dept => `
                    <div style="margin-bottom: 15px;">
                        <strong>${dept.name}:</strong><br>
                        Budget: ${formatCurrency(dept.annual)} | 
                        Used: ${formatCurrency(dept.utilized)} | 
                        Rate: ${((dept.utilized / dept.annual) * 100).toFixed(1)}%
                        ${dept.remaining < 0 ? '<span style="color: red;"> (OVER BUDGET)</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Export functions
function exportReceivingData() {
    const data = procurementData.goodsReceiving;
    const csvContent = convertToCSV(data, ['poNumber', 'supplier', 'department', 'items', 'expected', 'received', 'status', 'date']);
    downloadCSV(csvContent, 'goods-receiving-data.csv');
    showNotification('Goods receiving data exported successfully', 'success');
}

function exportInvoiceData() {
    const data = procurementData.invoices;
    const csvContent = convertToCSV(data, ['invoiceNumber', 'supplier', 'poReference', 'amount', 'dueDate', 'status', 'paymentMethod']);
    downloadCSV(csvContent, 'invoice-data.csv');
    showNotification('Invoice data exported successfully', 'success');
}

function convertToCSV(data, headers) {
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportReport() {
    showNotification('Report export functionality will be implemented with jsPDF', 'info');
}

function printReport() {
    const reportContent = document.getElementById('reportPreviewBody').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Procurement Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-content { max-width: 800px; }
                    .report-section { margin-bottom: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                ${reportContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(function() { printWindow.print(); }, 500);
}

// Utility functions
function getDepartmentName(department) {
    const departments = {
        'science': 'Science Department',
        'library': 'Library',
        'administration': 'Administration',
        'maintenance': 'Maintenance'
    };
    return departments[department] || department;
}

function viewReceivingDetails(id) {
    const item = procurementData.goodsReceiving.find(r => r.id === id);
    if (item) {
        showNotification(`Viewing details for ${item.poNumber}`, 'info');
    }
}

function editReceiving(id) {
    const item = procurementData.goodsReceiving.find(r => r.id === id);
    if (item) {
        // Populate the modal with existing data
        document.getElementById('receiptPONumber').value = item.poNumber;
        document.getElementById('receiptSupplier').value = item.supplier;
        document.getElementById('receiptDepartment').value = item.department;
        document.getElementById('receiptItems').value = item.items;
        document.getElementById('receiptExpected').value = item.expected;
        document.getElementById('receiptReceived').value = item.received;
        document.getElementById('receiptDate').value = item.date;
        document.getElementById('receiptNotes').value = item.notes || '';
        
        openModal('receiveGoodsModal');
    }
}

// Enhanced functionality for procurement module

// Checkbox and bulk operations
function toggleSelectAllReceiving(checkbox) {
    const checkboxes = document.querySelectorAll('#receivingTable .row-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    toggleDeleteButton('receiving');
}

function toggleSelectAllInvoices(checkbox) {
    const checkboxes = document.querySelectorAll('#invoicesTable .row-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    toggleDeleteButton('invoices');
}

function toggleDeleteButton(tableType) {
    const checkboxes = document.querySelectorAll(`#${tableType}Table .row-checkbox:checked`);
    const deleteBtn = document.getElementById(`deleteSelected${tableType.charAt(0).toUpperCase() + tableType.slice(1)}Btn`);
    
    if (deleteBtn) {
        deleteBtn.style.display = checkboxes.length > 0 ? 'inline-flex' : 'none';
    }
}

// Delete functions
function deleteReceiving(id) {
    const item = procurementData.goodsReceiving.find(r => r.id === id);
    if (item && confirm(`Are you sure you want to delete record ${item.poNumber}?`)) {
        procurementData.goodsReceiving = procurementData.goodsReceiving.filter(item => item.id !== id);
        updateReceivingCards();
        renderReceivingTable();
        showNotification('Record deleted successfully', 'success');
    }
}

function deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        procurementData.invoices = procurementData.invoices.filter(item => item.id !== id);
        updateInvoiceCards();
        renderInvoicesTable();
        showNotification('Invoice deleted successfully', 'success');
    }
}

function deleteSelectedReceiving() {
    const checkboxes = document.querySelectorAll('#receivingTable .row-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    
    if (ids.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${ids.length} selected records?`)) {
        procurementData.goodsReceiving = procurementData.goodsReceiving.filter(item => !ids.includes(item.id));
        updateReceivingCards();
        renderReceivingTable();
        showNotification(`${ids.length} records deleted successfully`, 'success');
    }
}

function deleteSelectedInvoices() {
    const checkboxes = document.querySelectorAll('#invoicesTable .row-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    
    if (ids.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${ids.length} selected invoices?`)) {
        procurementData.invoices = procurementData.invoices.filter(item => !ids.includes(item.id));
        updateInvoiceCards();
        renderInvoicesTable();
        showNotification(`${ids.length} invoices deleted successfully`, 'success');
    }
}

// Edit functions
function editInvoice(id) {
    const item = procurementData.invoices.find(inv => inv.id === id);
    if (item) {
        // Populate the modal with existing data
        document.getElementById('invoiceNumber').value = item.invoiceNumber;
        document.getElementById('invoicePORef').value = item.poReference;
        document.getElementById('invoiceSupplier').value = item.supplier;
        document.getElementById('invoiceAmount').value = item.amount;
        document.getElementById('invoiceDueDate').value = item.dueDate;
        document.getElementById('invoicePaymentMethod').value = item.paymentMethod;
        document.getElementById('invoiceStatus').value = item.status;
        document.getElementById('invoiceDate').value = item.date;
        document.getElementById('invoiceNotes').value = item.notes || '';
        
        openModal('processInvoiceModal');
    }
}

// Print receipt functions
function printReceivingReceipt(id) {
    const item = procurementData.goodsReceiving.find(r => r.id === id);
    if (item) {
        setupReceiptModal(item, 'receiving');
    }
}

function printInvoiceReceipt(id) {
    const item = procurementData.invoices.find(inv => inv.id === id);
    if (item) {
        setupReceiptModal(item, 'invoice');
    }
}

function setupReceiptModal(item, type) {
    // Set current date and generate receipt number
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    document.getElementById('receiptNumber').value = generateReceiptNumber();
    
    // Store item data for receipt generation
    window.currentReceiptItem = { ...item, type };
    
    // Generate preview
    generateReceiptPreview();
    
    openModal('receiptPrintModal');
}

function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${year}${month}${day}-${random}`;
}

function generateReceiptPreview() {
    const item = window.currentReceiptItem;
    if (!item) return;
    
    const schoolName = document.getElementById('schoolName').value;
    const managerName = document.getElementById('managerName').value;
    const receiverName = document.getElementById('receiverName').value;
    const transactionDate = document.getElementById('transactionDate').value;
    const receiptNumber = document.getElementById('receiptNumber').value;
    
    const preview = document.getElementById('receiptPreview');
    preview.innerHTML = `
        <div class="receipt-header">
            <h3>${schoolName}</h3>
            <p>PROCUREMENT RECEIPT</p>
            <p>Receipt No: ${receiptNumber}</p>
        </div>
        <div class="receipt-details">
            <p><strong>Date:</strong> ${formatDate(transactionDate)}</p>
            <p><strong>Manager:</strong> ${managerName}</p>
            <p><strong>Receiver:</strong> ${receiverName}</p>
            <p><strong>${item.type === 'receiving' ? 'PO Number' : 'Invoice Number'}:</strong> ${item.type === 'receiving' ? item.poNumber : item.invoiceNumber}</p>
            <p><strong>Supplier:</strong> ${item.supplier}</p>
        </div>
        <div class="receipt-items">
            <p><strong>Items/Services:</strong></p>
            <p>${item.items || 'Various procurement items'}</p>
            <p><strong>Amount:</strong> ${formatCurrency(item.value || item.amount)}</p>
        </div>
        <div class="receipt-footer">
            <p>Thank you for your business</p>
            <p>This is a computer-generated receipt</p>
        </div>
    `;
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptPreview').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Procurement Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 20px; }
                    .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                    .receipt-details { margin-bottom: 15px; }
                    .receipt-items { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 10px 0; margin: 15px 0; }
                    .receipt-footer { text-align: center; margin-top: 15px; font-size: 12px; }
                </style>
            </head>
            <body>
                ${receiptContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        closeModal('receiptPrintModal');
    }, 500);
}

// Import/Export functions
function handleImportReceiving(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',');
                        const newItem = {
                            id: procurementData.goodsReceiving.length + 1,
                            poNumber: values[0]?.replace(/"/g, '') || '',
                            supplier: values[1]?.replace(/"/g, '') || '',
                            department: values[2]?.replace(/"/g, '') || '',
                            items: values[3]?.replace(/"/g, '') || '',
                            expected: parseInt(values[4]) || 0,
                            received: parseInt(values[5]) || 0,
                            status: values[6]?.replace(/"/g, '') || 'pending',
                            date: values[7]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
                            value: parseInt(values[8]) || 0
                        };
                        procurementData.goodsReceiving.push(newItem);
                    }
                }
                
                updateReceivingCards();
                renderReceivingTable();
                showNotification('Data imported successfully', 'success');
            } catch (error) {
                showNotification('Error importing data. Please check file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function handleImportInvoices(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',');
                        const newItem = {
                            id: procurementData.invoices.length + 1,
                            invoiceNumber: values[0]?.replace(/"/g, '') || '',
                            supplier: values[1]?.replace(/"/g, '') || '',
                            poReference: values[2]?.replace(/"/g, '') || '',
                            amount: parseInt(values[3]) || 0,
                            dueDate: values[4]?.replace(/"/g, '') || '',
                            status: values[5]?.replace(/"/g, '') || 'pending',
                            paymentMethod: values[6]?.replace(/"/g, '') || 'bank',
                            date: new Date().toISOString().split('T')[0]
                        };
                        procurementData.invoices.push(newItem);
                    }
                }
                
                updateInvoiceCards();
                renderInvoiceTable();
                showNotification('Invoice data imported successfully', 'success');
            } catch (error) {
                showNotification('Error importing invoice data. Please check file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function updateItemOptions() {
    const category = document.getElementById('itemCategory').value;
    const itemSelect = document.getElementById('specificItem');
    
    // Convert select to input with datalist for flexibility
    if (itemSelect.tagName === 'SELECT') {
        const newInput = document.createElement('input');
        newInput.id = 'specificItem';
        newInput.className = 'form-control';
        newInput.setAttribute('list', 'itemOptions');
        newInput.placeholder = 'Enter or select item';
        
        const datalist = document.createElement('datalist');
        datalist.id = 'itemOptions';
        
        itemSelect.parentNode.replaceChild(newInput, itemSelect);
        newInput.parentNode.appendChild(datalist);
    }
    
    const datalist = document.getElementById('itemOptions');
    datalist.innerHTML = '';
    
    const itemOptions = {
        food: [
            'Mahindi (Maize)',
            'Mchele (Rice)', 
            'Unga wa Ngano (Wheat Flour)',
            'Unga wa Mahindi (Maize Flour)',
            'Sukari (Sugar)',
            'Chumvi (Salt)',
            'Mafuta (Cooking Oil)',
            'Maharage (Beans)',
            'Dengu (Lentils)',
            'Nyama (Meat)',
            'Samaki (Fish)',
            'Mayai (Eggs)',
            'Maziwa (Milk)',
            'Chai (Tea)',
            'Kahawa (Coffee)',
            'Mkate (Bread)',
            'Vitunguu (Onions)',
            'Nyanya (Tomatoes)'
        ],
        stationery: [
            'Vitabu vya Kuandikia (Exercise Books)',
            'Kalamu (Pens)',
            'Penseli (Pencils)', 
            'Karatasi (Paper)',
            'Chaki (Chalk)',
            'Ubao Mweupe (Whiteboard)',
            'Kalenda (Calendar)',
            'Faili (Files)',
            'Stapler',
            'Clips',
            'Rulers',
            'Erasers',
            'Markers',
            'Folders',
            'Notebooks'
        ],
        utilities: [
            'Umeme (Electricity)',
            'Maji (Water)',
            'Gesi (Gas)',
            'Simu (Telephone)',
            'Mtandao (Internet)',
            'Usafishaji (Cleaning Services)',
            'Security Services',
            'Waste Management',
            'Maintenance Services'
        ],
        maintenance: [
            'Rangi (Paint)',
            'Vifaa vya Ujenzi (Construction Materials)',
            'Vifaa vya Umeme (Electrical Supplies)',
            'Bomba (Pipes)',
            'Misumari (Nails)',
            'Vifaa vya Bustani (Garden Tools)',
            'Cement',
            'Sand',
            'Bricks',
            'Roofing Materials',
            'Plumbing Supplies'
        ],
        equipment: [
            'Kompyuta (Computers)',
            'Printa (Printers)',
            'Viti (Chairs)',
            'Meza (Tables)',
            'Kabati (Cabinets)',
            'Darubini (Microscopes)',
            'Vitabu (Books)',
            'Vifaa vya Michezo (Sports Equipment)',
            'Laboratory Equipment',
            'Audio Visual Equipment',
            'Air Conditioners',
            'Generators'
        ]
    };
    
    if (itemOptions[category]) {
        itemOptions[category].forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            datalist.appendChild(option);
        });
    }
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('itemQuantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('itemUnitPrice').value) || 0;
    const total = quantity * unitPrice;
    document.getElementById('itemTotalAmount').value = total;
}

function saveGoodsDetails() {
    const category = document.getElementById('itemCategory').value;
    const item = document.getElementById('specificItem').value;
    const quantity = document.getElementById('itemQuantity').value;
    const unit = document.getElementById('itemUnit').value;
    const unitPrice = document.getElementById('itemUnitPrice').value;
    const totalAmount = document.getElementById('itemTotalAmount').value;
    const purchaseDate = document.getElementById('itemPurchaseDate').value;
    const notes = document.getElementById('itemNotes').value;
    
    if (!category || !item || !quantity || !unitPrice) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const newGoods = {
        id: procurementData.goodsReceiving.length + 1,
        poNumber: generatePONumber(),
        supplier: 'Local Supplier',
        department: 'administration',
        items: `${item} (${quantity} ${unit})`,
        expected: parseInt(quantity),
        received: parseInt(quantity),
        status: 'complete',
        date: purchaseDate,
        value: parseInt(totalAmount),
        category: category,
        unitPrice: parseInt(unitPrice),
        notes: notes
    };
    
    procurementData.goodsReceiving.push(newGoods);
    
    updateReceivingCards();
    renderReceivingTable();
    closeModal('goodsDetailsModal');
    
    showNotification('Goods details saved successfully', 'success');
}

// Budget planning functions
function saveBudgetPlan() {
    const year = document.getElementById('planningYear').value;
    const totalBudget = parseInt(document.getElementById('totalSchoolBudget').value);
    const sciencePerc = parseInt(document.getElementById('sciencePercentage').value) || 0;
    const libraryPerc = parseInt(document.getElementById('libraryPercentage').value) || 0;
    const adminPerc = parseInt(document.getElementById('administrationPercentage').value) || 0;
    const maintenancePerc = parseInt(document.getElementById('maintenancePercentage').value) || 0;
    
    const totalPerc = sciencePerc + libraryPerc + adminPerc + maintenancePerc;
    
    if (totalPerc !== 100) {
        showNotification('Total allocation must equal 100%', 'error');
        return;
    }
    
    if (!totalBudget) {
        showNotification('Please enter total school budget', 'error');
        return;
    }
    
    // Update budget data
    procurementData.budgets.forEach(dept => {
        switch(dept.department) {
            case 'science':
                dept.annual = Math.floor(totalBudget * sciencePerc / 100);
                break;
            case 'library':
                dept.annual = Math.floor(totalBudget * libraryPerc / 100);
                break;
            case 'administration':
                dept.annual = Math.floor(totalBudget * adminPerc / 100);
                break;
            case 'maintenance':
                dept.annual = Math.floor(totalBudget * maintenancePerc / 100);
                break;
        }
        dept.remaining = dept.annual - dept.utilized;
        dept.period = year;
    });
    
    updateBudgetCards();
    renderBudgetItems();
    closeModal('budgetPlanningModal');
    
    showNotification('Budget plan saved successfully', 'success');
}

function exportBudgetData() {
    const data = procurementData.budgets;
    const csvContent = convertToCSV(data, ['department', 'name', 'annual', 'utilized', 'remaining', 'period']);
    downloadCSV(csvContent, 'budget-data.csv');
    showNotification('Budget data exported successfully', 'success');
}

function viewInvoiceDetails(id) {
    const item = procurementData.invoices.find(inv => inv.id === id);
    if (item) {
        showNotification(`Viewing details for ${item.invoiceNumber}`, 'info');
    }
}

// Translation data
const translations = {
    EN: {
        // Navigation
        dashboard: "Dashboard",
        students: "Students",
        fees_payments: "Fees & Payments",
        procurement: "Procurement",
        reports: "Reports",
        settings: "Settings",
        
        // Procurement tabs
        goods_receiving: "Goods Receiving",
        invoice_processing: "Invoice Processing", 
        budget_control: "Budget Control",
        reports_analytics: "Reports & Analytics",
        
        // Cards and headers
        total_received: "Total Received",
        pending_deliveries: "Pending Deliveries",
        partial_deliveries: "Partial Deliveries",
        complete_deliveries: "Complete Deliveries",
        total_invoices: "Total Invoices",
        pending_invoices: "Pending Invoices",
        approved_invoices: "Approved Invoices",
        paid_invoices: "Paid Invoices",
        total_budget: "Total Budget",
        utilized_budget: "Utilized Budget",
        remaining_budget: "Remaining Budget",
        over_budget_depts: "Over Budget Depts",
        
        // Table headers
        select: "Select",
        po_number: "PO Number",
        supplier: "Supplier",
        department: "Department",
        items: "Items",
        expected: "Expected",
        received: "Received",
        status: "Status",
        date: "Date",
        action: "Action",
        invoice_number: "Invoice Number",
        amount: "Amount",
        payment_method: "Payment Method",
        payment_status: "Payment Status",
        name: "Name",
        allocated: "Allocated",
        utilized: "Utilized",
        remaining: "Remaining",
        
        // Buttons
        add_new: "Add New",
        import_data: "Import Data",
        export_data: "Export Data",
        delete_selected: "Delete Selected",
        budget_planning: "Budget Planning",
        goods_details: "Goods Details",
        view: "View",
        edit: "Edit",
        delete: "Delete",
        print_receipt: "Print Receipt",
        save: "Save",
        cancel: "Cancel",
        close: "Close",
        
        // Status labels
        pending: "Pending",
        partial: "Partial", 
        complete: "Complete",
        approved: "Approved",
        paid: "Paid",
        
        // Departments
        administration: "Administration",
        science: "Science",
        library: "Library",
        maintenance: "Maintenance",
        
        // Modal titles
        budget_planning_setup: "Budget Planning & Setup",
        goods_purchase_details: "Goods Purchase Details",
        print_receipt_title: "Print Receipt",
        
        // Form labels
        school_name: "School Name",
        manager_name: "Manager Name",
        receiver_name: "Receiver Name",
        transaction_date: "Transaction Date",
        receipt_number: "Receipt Number",
        category: "Category",
        item: "Item",
        quantity: "Quantity",
        unit_price: "Unit Price",
        total_price: "Total Price"
    },
    SW: {
        // Navigation
        dashboard: "Dashibodi",
        students: "Wanafunzi",
        fees_payments: "Ada na Malipo",
        procurement: "Ununuzi",
        reports: "Ripoti",
        settings: "Mipangilio",
        
        // Procurement tabs
        goods_receiving: "Kupokea Bidhaa",
        invoice_processing: "Uhakiki wa Bili",
        budget_control: "Ufuatiliaji wa Bajeti", 
        reports_analytics: "Ripoti na Taarifa",
        
        // Cards and headers
        total_received: "Jumla ya Bidhaa Zilizopokelewa",
        pending_deliveries: "Uwasilishaji Unaongoja",
        partial_deliveries: "Uwasilishaji wa Sehemu",
        complete_deliveries: "Uwasilishaji Kamili",
        total_invoices: "Jumla ya Bili",
        pending_invoices: "Bili Zinazosubiri",
        approved_invoices: "Bili Zilizoidhinishwa",
        paid_invoices: "Bili Zilizolipwa",
        total_budget: "Jumla ya Bajeti",
        utilized_budget: "Bajeti Iliyotumika",
        remaining_budget: "Bajeti Iliyobaki",
        over_budget_depts: "Idara Zilizopita Bajeti",
        
        // Table headers
        select: "Chagua",
        po_number: "Nambari ya Agizo",
        supplier: "Muuzaji",
        department: "Idara",
        items: "Bidhaa",
        expected: "Inayotarajiwa",
        received: "Imepokelewa",
        status: "Hali",
        date: "Tarehe",
        action: "Kitendo",
        invoice_number: "Nambari ya Bili",
        amount: "Kiasi",
        payment_method: "Njia ya Malipo",
        payment_status: "Hali ya Malipo",
        name: "Jina",
        allocated: "Imegawiwa",
        utilized: "Imetumika",
        remaining: "Imebaki",
        
        // Buttons
        add_new: "Ongeza Mpya",
        import_data: "Ingiza Data",
        export_data: "Hamisha Data",
        delete_selected: "Futa Zilizochaguliwa",
        budget_planning: "Mpango wa Bajeti",
        goods_details: "Maelezo ya Bidhaa",
        view: "Ona",
        edit: "Hariri",
        delete: "Futa",
        print_receipt: "Chapisha Risiti",
        save: "Hifadhi",
        cancel: "Ghairi",
        close: "Funga",
        
        // Status labels
        pending: "Inasubiri",
        partial: "Sehemu",
        complete: "Kamili",
        approved: "Imeidhinishwa",
        paid: "Imelipwa",
        
        // Departments
        administration: "Utawala",
        science: "Sayansi",
        library: "Maktaba",
        maintenance: "Matengenezo",
        
        // Modal titles
        budget_planning_setup: "Mpango na Usanidi wa Bajeti",
        goods_purchase_details: "Maelezo ya Ununuzi wa Bidhaa",
        print_receipt_title: "Chapisha Risiti",
        
        // Form labels
        school_name: "Jina la Shule",
        manager_name: "Jina la Meneja",
        receiver_name: "Jina la Mpokeaji",
        transaction_date: "Tarehe ya Muamala",
        receipt_number: "Nambari ya Risiti",
        category: "Aina",
        item: "Bidhaa",
        quantity: "Idadi",
        unit_price: "Bei ya Kipimo",
        total_price: "Jumla ya Bei"
    }
};

// Language toggle function
function toggleLanguage() {
    currentLanguage = currentLanguage === 'EN' ? 'SW' : 'EN';
    const langButton = document.getElementById('langToggle');
    if (langButton) {
        langButton.textContent = currentLanguage;
    }
    
    // Update UI text based on language
    updateLanguageText();
    
    // Show notification
    const lang = translations[currentLanguage];
    showNotification(`Language changed to ${currentLanguage === 'EN' ? 'English' : 'Kiswahili'}`, 'success');
}

// Update all translatable text
function updateLanguageText() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            // Handle both text content and nested spans
            const span = element.querySelector('span');
            if (span) {
                span.textContent = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Update specific elements that might not have data-translate attributes
    updateTabLabels();
    updateTableHeaders();
    updateCardTitles();
    updateButtonLabels();
    updateModalTitles();
    
    // Re-render tables to update content
    renderReceivingTable();
    renderInvoiceTable();
    renderBudgetItems();
}

// Render budget items and budget table
function renderBudgetItems() {
    // Render budget items cards
    const container = document.getElementById('budgetItems');
    if (container) {
        const data = procurementData.budgets;
        container.innerHTML = '';
        
        data.forEach(item => {
            const percentage = item.annual > 0 ? Math.round((item.utilized / item.annual) * 100) : 0;
            const statusClass = percentage > 100 ? 'over-budget' : percentage > 80 ? 'warning' : 'normal';
            
            const budgetItem = document.createElement('div');
            budgetItem.className = 'budget-item';
            budgetItem.innerHTML = `
                <div class="budget-info">
                    <h4>${item.name}</h4>
                    <div class="budget-amounts">
                        <span>Allocated: ${formatCurrency(item.annual)}</span>
                        <span>Used: ${formatCurrency(item.utilized)}</span>
                        <span>Remaining: ${formatCurrency(item.remaining)}</span>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <span class="percentage">${percentage}%</span>
                </div>
            `;
            container.appendChild(budgetItem);
        });
    }
    
    // Render budget table
    const tbody = document.getElementById('budgetTableBody');
    if (tbody) {
        const data = procurementData.budgets;
        tbody.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${formatCurrency(item.annual)}</td>
                <td>${formatCurrency(item.utilized)}</td>
                <td class="${item.remaining < 0 ? 'negative' : 'positive'}">${formatCurrency(item.remaining)}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Update tab labels specifically
function updateTabLabels() {
    const lang = translations[currentLanguage];
    
    // Update tab buttons
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length >= 4) {
        tabs[0].querySelector('span') ? tabs[0].querySelector('span').textContent = lang.goods_receiving : null;
        tabs[1].querySelector('span') ? tabs[1].querySelector('span').textContent = lang.invoice_processing : null;
        tabs[2].querySelector('span') ? tabs[2].querySelector('span').textContent = lang.budget_control : null;
        tabs[3].querySelector('span') ? tabs[3].querySelector('span').textContent = lang.reports_analytics : null;
    }
}

// Update table headers with translations
function updateTableHeaders() {
    const lang = translations[currentLanguage];
    
    // Update receiving table headers
    const receivingHeaders = document.querySelectorAll('#receivingTable th');
    if (receivingHeaders.length > 0) {
        receivingHeaders[0].textContent = lang.select;
        receivingHeaders[1].textContent = lang.po_number;
        receivingHeaders[2].textContent = lang.supplier;
        receivingHeaders[3].textContent = lang.department;
        receivingHeaders[4].textContent = lang.items;
        receivingHeaders[5].textContent = lang.expected;
        receivingHeaders[6].textContent = lang.received;
        receivingHeaders[7].textContent = lang.status;
        receivingHeaders[8].textContent = lang.date;
        receivingHeaders[9].textContent = lang.action;
    }
    
    // Update invoice table headers
    const invoiceHeaders = document.querySelectorAll('#invoiceTable th');
    if (invoiceHeaders.length > 0) {
        invoiceHeaders[0].textContent = lang.select;
        invoiceHeaders[1].textContent = lang.invoice_number;
        invoiceHeaders[2].textContent = lang.supplier;
        invoiceHeaders[3].textContent = lang.department;
        invoiceHeaders[4].textContent = lang.amount;
        invoiceHeaders[5].textContent = lang.payment_method;
        invoiceHeaders[6].textContent = lang.payment_status;
        invoiceHeaders[7].textContent = lang.date;
        invoiceHeaders[8].textContent = lang.action;
    }
    
    // Update budget table headers
    const budgetHeaders = document.querySelectorAll('#budgetTable th');
    if (budgetHeaders.length > 0) {
        budgetHeaders[0].textContent = lang.department;
        budgetHeaders[1].textContent = lang.allocated;
        budgetHeaders[2].textContent = lang.utilized;
        budgetHeaders[3].textContent = lang.remaining;
    }
}

// Update card titles with translations
function updateCardTitles() {
    const lang = translations[currentLanguage];
    
    // Update receiving cards
    const receivingCardTitles = document.querySelectorAll('.receiving-section .card h3');
    if (receivingCardTitles.length >= 4) {
        receivingCardTitles[0].textContent = lang.total_received;
        receivingCardTitles[1].textContent = lang.pending_deliveries;
        receivingCardTitles[2].textContent = lang.partial_deliveries;
        receivingCardTitles[3].textContent = lang.complete_deliveries;
    }
    
    // Update invoice cards
    const invoiceCardTitles = document.querySelectorAll('.invoice-section .card h3');
    if (invoiceCardTitles.length >= 4) {
        invoiceCardTitles[0].textContent = lang.total_invoices;
        invoiceCardTitles[1].textContent = lang.pending_invoices;
        invoiceCardTitles[2].textContent = lang.approved_invoices;
        invoiceCardTitles[3].textContent = lang.paid_invoices;
    }
    
    // Update budget cards
    const budgetCardTitles = document.querySelectorAll('.budget-section .card h3');
    if (budgetCardTitles.length >= 4) {
        budgetCardTitles[0].textContent = lang.total_budget;
        budgetCardTitles[1].textContent = lang.utilized_budget;
        budgetCardTitles[2].textContent = lang.remaining_budget;
        budgetCardTitles[3].textContent = lang.over_budget_depts;
    }
}

// Update button labels with translations
function updateButtonLabels() {
    const lang = translations[currentLanguage];
    
    // Update action buttons
    document.querySelectorAll('.action-btn.view').forEach(btn => {
        btn.title = lang.view;
    });
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.title = lang.edit;
    });
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.title = lang.delete;
    });
    document.querySelectorAll('.action-btn.print').forEach(btn => {
        btn.title = lang.print_receipt;
    });
}

// Update modal titles with translations
function updateModalTitles() {
    const lang = translations[currentLanguage];
    
    const budgetModalTitle = document.querySelector('#budgetPlanningModal .modal-header h2');
    if (budgetModalTitle) {
        budgetModalTitle.textContent = lang.budget_planning_setup;
    }
    
    const goodsModalTitle = document.querySelector('#goodsDetailsModal .modal-header h2');
    if (goodsModalTitle) {
        goodsModalTitle.textContent = lang.goods_purchase_details;
    }
    
    const receiptModalTitle = document.querySelector('#receiptPrintModal .modal-header h2');
    if (receiptModalTitle) {
        receiptModalTitle.textContent = lang.print_receipt_title;
    }
}
