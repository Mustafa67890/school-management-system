// Staff & Payroll Module JavaScript
// Sample staff data
let staffData = [
    {
        id: 1,
        staffNo: 'STF001',
        fullName: 'John Kamau',
        position: 'Teacher',
        department: 'Mathematics',
        subjects: ['Mathematics', 'Physics'],
        classes: ['Form 1A', 'Form 2B'],
        employmentType: 'full-time',
        salaryType: 'monthly',
        baseSalary: 800000,
        phone: '+255 712 345 678',
        email: 'john.kamau@school.com',
        nationalId: '19850315-12345-67890',
        bankName: 'CRDB Bank',
        accountNumber: '0150123456789',
        dateOfEmployment: '2020-01-15',
        status: 'active',
        address: 'Dar es Salaam, Tanzania',
        allowances: [
            { type: 'Transport', amount: 50000 },
            { type: 'Housing', amount: 100000 }
        ],
        deductions: [
            { type: 'PAYE', amount: 120000 },
            { type: 'NSSF', amount: 40000 }
        ]
    },
    {
        id: 2,
        staffNo: 'STF002',
        fullName: 'Mary Mwalimu',
        position: 'Head Teacher',
        department: 'Administration',
        subjects: ['English', 'Literature'],
        classes: ['Form 3A', 'Form 4A'],
        employmentType: 'full-time',
        salaryType: 'monthly',
        baseSalary: 1200000,
        phone: '+255 713 456 789',
        email: 'mary.mwalimu@school.com',
        nationalId: '19800220-98765-43210',
        bankName: 'NMB Bank',
        accountNumber: '20150987654321',
        dateOfEmployment: '2018-08-01',
        status: 'active',
        address: 'Arusha, Tanzania',
        allowances: [
            { type: 'Management', amount: 200000 },
            { type: 'Transport', amount: 75000 }
        ],
        deductions: [
            { type: 'PAYE', amount: 200000 },
            { type: 'NSSF', amount: 60000 }
        ]
    }
];

let currentEditingStaff = null;

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Navigation Functions
function navigateToPage(url) {
    window.location.href = url;
}

// Staff CRUD Operations
function openAddStaffModal() {
    currentEditingStaff = null;
    document.getElementById('modalTitle').textContent = 'Add New Staff';
    clearStaffForm();
    openModal('staffModal');
}

function clearStaffForm() {
    const form = document.getElementById('staffForm');
    form.reset();
    document.getElementById('staffId').value = '';
    document.getElementById('allowancesList').innerHTML = '';
    document.getElementById('deductionsList').innerHTML = '';
    
    // Clear photo preview
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.src = '';
        photoPreview.style.display = 'none';
    }
}

function editStaff(id) {
    const staff = staffData.find(function(s) { return s.id === id; });
    if (!staff) return;
    
    currentEditingStaff = staff;
    document.getElementById('modalTitle').textContent = 'Edit Staff';
    
    // Populate form fields
    document.getElementById('staffId').value = staff.id;
    document.getElementById('staffNo').value = staff.staffNo;
    document.getElementById('fullName').value = staff.fullName;
    document.getElementById('position').value = staff.position;
    document.getElementById('department').value = staff.department;
    document.getElementById('employmentType').value = staff.employmentType;
    document.getElementById('salaryType').value = staff.salaryType;
    document.getElementById('baseSalary').value = staff.baseSalary;
    document.getElementById('phone').value = staff.phone;
    document.getElementById('email').value = staff.email;
    document.getElementById('nationalId').value = staff.nationalId;
    document.getElementById('bankName').value = staff.bankName;
    document.getElementById('accountNumber').value = staff.accountNumber;
    document.getElementById('dateOfEmployment').value = staff.dateOfEmployment;
    document.getElementById('status').value = staff.status;
    document.getElementById('address').value = staff.address;
    
    // Populate allowances
    const allowancesList = document.getElementById('allowancesList');
    allowancesList.innerHTML = '';
    if (staff.allowances) {
        staff.allowances.forEach(function(allowance) {
            addAllowanceToList(allowance.type, allowance.amount);
        });
    }
    
    // Populate deductions
    const deductionsList = document.getElementById('deductionsList');
    deductionsList.innerHTML = '';
    if (staff.deductions) {
        staff.deductions.forEach(function(deduction) {
            addDeductionToList(deduction.type, deduction.amount);
        });
    }
    
    openModal('staffModal');
}

function addAllowance() {
    const type = document.getElementById('allowanceType').value.trim();
    const amount = parseFloat(document.getElementById('allowanceAmount').value);
    
    if (type && amount > 0) {
        addAllowanceToList(type, amount);
        document.getElementById('allowanceType').value = '';
        document.getElementById('allowanceAmount').value = '';
    }
}

function addAllowanceToList(type, amount) {
    const allowancesList = document.getElementById('allowancesList');
    const div = document.createElement('div');
    div.className = 'allowance-item';
    div.innerHTML = `
        <span>${type}: ${formatCurrency(amount)}</span>
        <button type="button" onclick="this.parentElement.remove()" class="btn btn-danger">Remove</button>
    `;
    div.dataset.type = type;
    div.dataset.amount = amount;
    allowancesList.appendChild(div);
}

function addDeduction() {
    const type = document.getElementById('deductionType').value.trim();
    const amount = parseFloat(document.getElementById('deductionAmount').value);
    
    if (type && amount > 0) {
        addDeductionToList(type, amount);
        document.getElementById('deductionType').value = '';
        document.getElementById('deductionAmount').value = '';
    }
}

function addDeductionToList(type, amount) {
    const deductionsList = document.getElementById('deductionsList');
    const div = document.createElement('div');
    div.className = 'deduction-item';
    div.innerHTML = `
        <span>${type}: ${formatCurrency(amount)}</span>
        <button type="button" onclick="this.parentElement.remove()" class="btn btn-danger">Remove</button>
    `;
    div.dataset.type = type;
    div.dataset.amount = amount;
    deductionsList.appendChild(div);
}

function saveStaff() {
    // Get form data
    const staffNo = document.getElementById('staffNo').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const position = document.getElementById('position').value.trim();
    const department = document.getElementById('department').value.trim();
    const baseSalary = parseFloat(document.getElementById('baseSalary').value) || 0;
    
    if (!staffNo || !fullName || !position || !department) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Collect allowances
    const allowances = [];
    document.querySelectorAll('#allowancesList .allowance-item').forEach(function(item) {
        allowances.push({
            type: item.dataset.type,
            amount: parseFloat(item.dataset.amount)
        });
    });
    
    // Collect deductions
    const deductions = [];
    document.querySelectorAll('#deductionsList .deduction-item').forEach(function(item) {
        deductions.push({
            type: item.dataset.type,
            amount: parseFloat(item.dataset.amount)
        });
    });
    
    const staffItem = {
        id: currentEditingStaff ? currentEditingStaff.id : Date.now(),
        staffNo: staffNo,
        fullName: fullName,
        position: position,
        department: department,
        subjects: [], // Would be populated from multi-select
        classes: [], // Would be populated from multi-select
        employmentType: document.getElementById('employmentType').value,
        salaryType: document.getElementById('salaryType').value,
        baseSalary: baseSalary,
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        nationalId: document.getElementById('nationalId').value.trim(),
        bankName: document.getElementById('bankName').value.trim(),
        accountNumber: document.getElementById('accountNumber').value.trim(),
        dateOfEmployment: document.getElementById('dateOfEmployment').value,
        status: document.getElementById('status').value,
        address: document.getElementById('address').value.trim(),
        allowances: allowances,
        deductions: deductions
    };
    
    if (currentEditingStaff) {
        const index = staffData.findIndex(function(s) { return s.id === currentEditingStaff.id; });
        staffData[index] = staffItem;
        showNotification('Staff updated successfully!', 'success');
    } else {
        staffData.push(staffItem);
        showNotification('Staff added successfully!', 'success');
    }
    
    closeModal('staffModal');
    renderTable();
    updateCards();
}

function deleteStaff(id) {
    if (confirm('Are you sure you want to delete this staff member?')) {
        staffData = staffData.filter(function(s) { return s.id !== id; });
        renderTable();
        updateCards();
        showNotification('Staff deleted successfully!', 'success');
    }
}

function viewStaff(id) {
    const staff = staffData.find(function(s) { return s.id === id; });
    if (staff) {
        alert(`Staff Details:\nName: ${staff.fullName}\nPosition: ${staff.position}\nDepartment: ${staff.department}\nSalary: ${formatCurrency(staff.baseSalary)}`);
    }
}

// Table Rendering
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const departmentFilter = document.getElementById('filterDepartment').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filteredData = staffData.filter(function(staff) {
        const matchesSearch = staff.fullName.toLowerCase().includes(searchTerm) || 
                            staff.staffNo.toLowerCase().includes(searchTerm);
        const matchesDepartment = !departmentFilter || staff.department === departmentFilter;
        const matchesStatus = !statusFilter || staff.status === statusFilter;
        return matchesSearch && matchesDepartment && matchesStatus;
    });
    
    tbody.innerHTML = filteredData.map(function(staff) {
        return `
            <tr>
                <td><input type="checkbox" class="staff-checkbox" value="${staff.id}"></td>
                <td>${staff.staffNo}</td>
                <td>${staff.fullName}</td>
                <td>${staff.department}</td>
                <td>${staff.position}</td>
                <td>${formatCurrency(staff.baseSalary)}</td>
                <td><span class="status-badge status-${staff.status}">${capitalizeFirst(staff.status)}</span></td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-outline" onclick="viewStaff(${staff.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline" onclick="editStaff(${staff.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline" onclick="generatePayslip(${staff.id})" title="Payslip">
                            <i class="fas fa-receipt"></i>
                        </button>
                        <button class="btn btn-outline" onclick="deleteStaff(${staff.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Payroll Functions
function processPayroll() {
    openModal('payrollModal');
    calculatePayroll();
}

function calculatePayroll() {
    const tbody = document.getElementById('payrollTableBody');
    const activeStaff = staffData.filter(function(s) { return s.status === 'active'; });
    
    tbody.innerHTML = activeStaff.map(function(staff) {
        const allowancesTotal = (staff.allowances || []).reduce(function(sum, a) { return sum + a.amount; }, 0);
        const deductionsTotal = (staff.deductions || []).reduce(function(sum, d) { return sum + d.amount; }, 0);
        const gross = staff.baseSalary + allowancesTotal;
        const net = gross - deductionsTotal;
        
        return `
            <tr>
                <td><input type="checkbox" class="payroll-checkbox" value="${staff.id}"></td>
                <td>${staff.fullName}</td>
                <td>${formatCurrency(staff.baseSalary)}</td>
                <td>${formatCurrency(allowancesTotal)}</td>
                <td>${formatCurrency(gross)}</td>
                <td>${formatCurrency(deductionsTotal)}</td>
                <td>${formatCurrency(net)}</td>
                <td><span class="status-badge status-active">Pending</span></td>
                <td>
                    <button class="btn btn-success" onclick="markAsPaid(${staff.id})">
                        <i class="fas fa-check"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function markAsPaid(staffId) {
    showNotification('Payment recorded successfully!', 'success');
}

function generatePayslip(staffId) {
    const staff = staffData.find(function(s) { return s.id === staffId; });
    if (!staff) return;
    
    const allowancesTotal = (staff.allowances || []).reduce(function(sum, a) { return sum + a.amount; }, 0);
    const deductionsTotal = (staff.deductions || []).reduce(function(sum, d) { return sum + d.amount; }, 0);
    const gross = staff.baseSalary + allowancesTotal;
    const net = gross - deductionsTotal;
    
    const payslipHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2>SCHOOL MANAGEMENT SYSTEM</h2>
                <h3>PAYSLIP - ${new Date().toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong>Employee Information:</strong><br>
                Staff No: ${staff.staffNo}<br>
                Name: ${staff.fullName}<br>
                Position: ${staff.position}<br>
                Department: ${staff.department}
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 8px;">EARNINGS</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">AMOUNT (TZS)</th>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">Base Salary</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(staff.baseSalary)}</td>
                </tr>
                <tr style="background: #e9ecef; font-weight: bold;">
                    <td style="border: 1px solid #ddd; padding: 8px;">NET PAY</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(net)}</td>
                </tr>
            </table>
        </div>
    `;
    
    document.getElementById('payslipContent').innerHTML = payslipHTML;
    openModal('payslipModal');
}

function printPayslip() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head><title>Payslip</title></head>
            <body>${document.getElementById('payslipContent').innerHTML}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0
    }).format(amount);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateCards() {
    const totalStaff = staffData.length;
    const activeStaff = staffData.filter(function(s) { return s.status === 'active'; }).length;
    const inactiveStaff = staffData.filter(function(s) { return s.status === 'inactive'; }).length;
    const totalPayroll = staffData.filter(function(s) { return s.status === 'active'; })
        .reduce(function(sum, s) { return sum + s.baseSalary; }, 0);
    
    document.getElementById('cardTotalStaff').textContent = totalStaff;
    document.getElementById('cardActiveStaff').textContent = activeStaff;
    document.getElementById('cardInactiveStaff').textContent = inactiveStaff;
    document.getElementById('cardMonthlyPayroll').textContent = formatCurrency(totalPayroll);
}

function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.remove();
    }, 3000);
}

// Export Functions
function exportCSV() {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Staff No,Full Name,Position,Department,Salary,Status\n" +
        staffData.map(function(staff) {
            return `${staff.staffNo},${staff.fullName},${staff.position},${staff.department},${staff.baseSalary},${staff.status}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "staff_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportXLSX() {
    showNotification('Excel export functionality would be implemented here', 'success');
}

function exportPDF() {
    showNotification('PDF export functionality would be implemented here', 'success');
}

// Filter Functions
function applyQuickFilter(filter) {
    const statusFilter = document.getElementById('filterStatus');
    switch(filter) {
        case 'active':
            statusFilter.value = 'active';
            break;
        case 'inactive':
            statusFilter.value = 'inactive';
            break;
        default:
            statusFilter.value = '';
    }
    renderTable();
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.staff-checkbox');
    checkboxes.forEach(function(cb) { cb.checked = checkbox.checked; });
}

function toggleSelectAllPayroll(checkbox) {
    const checkboxes = document.querySelectorAll('.payroll-checkbox');
    checkboxes.forEach(function(cb) { cb.checked = checkbox.checked; });
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');
}

function toggleLanguage() {
    const currentLanguage = document.getElementById('language-text').textContent === 'EN' ? 'SW' : 'EN';
    document.getElementById('language-text').textContent = currentLanguage;
}

// Import Functions
function handleImport(event) {
    openModal('importModal');
}

function previewImport() {
    showNotification('Import preview functionality would be implemented here', 'success');
}

function confirmImport() {
    showNotification('Import confirmation functionality would be implemented here', 'success');
}

function printPayslipsBulk() {
    showNotification('Bulk payslip printing functionality would be implemented here', 'success');
}

function downloadPayslipPDF() {
    showNotification('PDF download functionality would be implemented here', 'success');
}

function showPayrollSummary() {
    showNotification('Payroll summary functionality would be implemented here', 'success');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderTable();
    updateCards();
    setInterval(updateTime, 1000);
    updateTime();
});
