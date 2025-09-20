// Staff & Payroll Module - UI Functions and CRUD Operations

// Render staff table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const departmentFilter = document.getElementById('filterDepartment')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';

    let filteredData = staffData.filter(staff => {
        const matchesSearch = staff.fullName.toLowerCase().includes(searchTerm) ||
                            staff.staffNo.toLowerCase().includes(searchTerm) ||
                            staff.position.toLowerCase().includes(searchTerm);
        const matchesDepartment = !departmentFilter || staff.department === departmentFilter;
        const matchesStatus = !statusFilter || staff.status === statusFilter;
        
        return matchesSearch && matchesDepartment && matchesStatus;
    });

    tbody.innerHTML = filteredData.map(staff => `
        <tr>
            <td><input type="checkbox" value="${staff.id}" onchange="updateSelectedStaff()"></td>
            <td>${staff.staffNo}</td>
            <td>${staff.fullName}</td>
            <td>${staff.department}</td>
            <td>${staff.position}</td>
            <td>TZS ${staff.baseSalary.toLocaleString()}</td>
            <td>
                <span class="status-badge status-${staff.status}">
                    <i class="fas fa-circle"></i>
                    ${staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                </span>
            </td>
            <td class="row-actions">
                <button class="btn btn-outline" onclick="viewStaff(${staff.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline" onclick="editStaff(${staff.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline" onclick="deleteStaff(${staff.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-outline" onclick="generatePayslip(${staff.id})" title="Payslip">
                    <i class="fas fa-file-invoice"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
    
    if (modalId === 'staffModal') {
        const form = document.getElementById('staffForm');
        if (form) {
            form.reset();
        }
        currentEditingStaff = null;
    }
}

// Staff CRUD Operations
function addStaff() {
    currentEditingStaff = null;
    const modalTitle = document.getElementById('staffModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Staff';
    }
    
    const form = document.getElementById('staffForm');
    if (form) {
        form.reset();
    }
    
    openModal('staffModal');
}

function editStaff(id) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;

    currentEditingStaff = staff;
    const modalTitle = document.getElementById('staffModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Staff';
    }
    
    // Populate form fields
    const fields = {
        'staffNo': staff.staffNo,
        'fullName': staff.fullName,
        'position': staff.position,
        'department': staff.department,
        'employmentType': staff.employmentType,
        'salaryType': staff.salaryType,
        'baseSalary': staff.baseSalary,
        'phone': staff.phoneNumber,
        'email': staff.email,
        'nationalId': staff.nationalId,
        'bankName': staff.bankName,
        'accountNumber': staff.bankAccount,
        'dateOfEmployment': staff.dateOfEmployment,
        'status': staff.status,
        'address': staff.address
    };
    
    Object.keys(fields).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = fields[fieldId] || '';
        }
    });
    
    // Handle multi-select fields
    const subjectsSelect = document.getElementById('subjects');
    if (subjectsSelect && staff.subjects) {
        Array.from(subjectsSelect.options).forEach(option => {
            option.selected = staff.subjects.includes(option.value);
        });
    }
    
    const classesSelect = document.getElementById('classes');
    if (classesSelect && staff.classes) {
        Array.from(classesSelect.options).forEach(option => {
            option.selected = staff.classes.includes(option.value);
        });
    }
    
    // Populate allowances and deductions as JSON
    const allowancesField = document.getElementById('allowances');
    if (allowancesField) {
        allowancesField.value = JSON.stringify(staff.allowances || [], null, 2);
    }
    
    const deductionsField = document.getElementById('deductions');
    if (deductionsField) {
        deductionsField.value = JSON.stringify(staff.deductions || [], null, 2);
    }

    openModal('staffModal');
}

function saveStaff() {
    // Get form data
    const staffNo = document.getElementById('staffNo')?.value.trim() || '';
    const fullName = document.getElementById('fullName')?.value.trim() || '';
    const position = document.getElementById('position')?.value.trim() || '';
    const department = document.getElementById('department')?.value.trim() || '';
    const baseSalary = parseFloat(document.getElementById('baseSalary')?.value) || 0;
    
    if (!staffNo || !fullName || !position || !department) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get selected subjects and classes
    const subjectsSelect = document.getElementById('subjects');
    const subjects = subjectsSelect ? Array.from(subjectsSelect.selectedOptions).map(option => option.value) : [];
    
    const classesSelect = document.getElementById('classes');
    const classes = classesSelect ? Array.from(classesSelect.selectedOptions).map(option => option.value) : [];
    
    // Parse allowances and deductions
    let allowances = [];
    let deductions = [];
    
    try {
        const allowancesText = document.getElementById('allowances')?.value.trim() || '';
        if (allowancesText) {
            allowances = JSON.parse(allowancesText);
        }
    } catch (e) {
        showNotification('Invalid allowances format. Use JSON format.', 'error');
        return;
    }
    
    try {
        const deductionsText = document.getElementById('deductions')?.value.trim() || '';
        if (deductionsText) {
            deductions = JSON.parse(deductionsText);
        }
    } catch (e) {
        showNotification('Invalid deductions format. Use JSON format.', 'error');
        return;
    }
    
    const staffItem = {
        id: currentEditingStaff ? currentEditingStaff.id : Date.now(),
        staffNo: staffNo,
        fullName: fullName,
        position: position,
        department: department,
        subjects: subjects,
        classes: classes,
        employmentType: document.getElementById('employmentType')?.value || 'Permanent',
        salaryType: document.getElementById('salaryType')?.value || 'Monthly',
        baseSalary: baseSalary,
        phoneNumber: document.getElementById('phone')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        nationalId: document.getElementById('nationalId')?.value.trim() || '',
        bankName: document.getElementById('bankName')?.value.trim() || '',
        bankAccount: document.getElementById('accountNumber')?.value.trim() || '',
        dateOfEmployment: document.getElementById('dateOfEmployment')?.value || '',
        status: document.getElementById('status')?.value || 'active',
        address: document.getElementById('address')?.value.trim() || '',
        allowances: allowances,
        deductions: deductions
    };
    
    if (currentEditingStaff) {
        const index = staffData.findIndex(s => s.id === currentEditingStaff.id);
        if (index !== -1) {
            staffData[index] = staffItem;
            showNotification('Staff updated successfully!', 'success');
        }
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
        staffData = staffData.filter(s => s.id !== id);
        renderTable();
        updateCards();
        showNotification('Staff deleted successfully!', 'success');
    }
}

function viewStaff(id) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;
    
    const allowancesTotal = (staff.allowances || []).reduce((sum, a) => sum + a.amount, 0);
    const deductionsTotal = (staff.deductions || []).reduce((sum, d) => sum + d.amount, 0);
    const netSalary = staff.baseSalary + allowancesTotal - deductionsTotal;
    
    alert(`Staff Details:

Name: ${staff.fullName}
Staff No: ${staff.staffNo}
Position: ${staff.position}
Department: ${staff.department}
Base Salary: TZS ${staff.baseSalary.toLocaleString()}
Net Salary: TZS ${netSalary.toLocaleString()}
Status: ${staff.status}
Email: ${staff.email}
Phone: ${staff.phoneNumber}`);
}

// Payroll functions
function processPayroll() {
    if (staffData.length === 0) {
        showNotification('No staff data available for payroll processing', 'error');
        return;
    }
    
    const totalPayroll = staffData.reduce((sum, staff) => {
        const allowancesTotal = (staff.allowances || []).reduce((sum, a) => sum + a.amount, 0);
        const deductionsTotal = (staff.deductions || []).reduce((sum, d) => sum + d.amount, 0);
        return sum + (staff.baseSalary + allowancesTotal - deductionsTotal);
    }, 0);
    
    if (confirm(`Process payroll for ${staffData.length} staff members?\nTotal amount: TZS ${totalPayroll.toLocaleString()}`)) {
        showNotification(`Payroll processed successfully! Total: TZS ${totalPayroll.toLocaleString()}`, 'success');
    }
}

function showPayrollSummary() {
    const totalStaff = staffData.length;
    const totalGross = staffData.reduce((sum, s) => sum + (s.baseSalary || 0), 0);
    const totalAllowances = staffData.reduce((sum, s) => {
        return sum + ((s.allowances || []).reduce((aSum, a) => aSum + a.amount, 0));
    }, 0);
    const totalDeductions = staffData.reduce((sum, s) => {
        return sum + ((s.deductions || []).reduce((dSum, d) => dSum + d.amount, 0));
    }, 0);
    const totalNet = totalGross + totalAllowances - totalDeductions;
    
    alert(`Payroll Summary:

Total Staff: ${totalStaff}
Total Gross Salary: TZS ${totalGross.toLocaleString()}
Total Allowances: TZS ${totalAllowances.toLocaleString()}
Total Deductions: TZS ${totalDeductions.toLocaleString()}
Total Net Payroll: TZS ${totalNet.toLocaleString()}`);
}

// Payslip generation
function generatePayslip(id) {
    const staff = staffData.find(s => s.id === id);
    if (!staff) return;

    // Calculate totals
    const allowancesTotal = (staff.allowances || []).reduce((sum, a) => sum + a.amount, 0);
    const deductionsTotal = (staff.deductions || []).reduce((sum, d) => sum + d.amount, 0);
    const grossSalary = staff.baseSalary + allowancesTotal;
    const netSalary = grossSalary - deductionsTotal;

    // Create payslip window
    const payslipWindow = window.open('', '_blank', 'width=800,height=600');
    payslipWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payslip - ${staff.fullName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .section { margin-bottom: 15px; }
                .section h3 { background: #f0f0f0; padding: 5px; margin: 0; }
                .item { display: flex; justify-content: space-between; padding: 3px 0; }
                .total { font-weight: bold; border-top: 1px solid #333; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SCHOOL MANAGEMENT SYSTEM</h1>
                <h2>PAYSLIP</h2>
                <p>Pay Period: ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div class="info">
                <div>
                    <strong>Employee Details:</strong><br>
                    Name: ${staff.fullName}<br>
                    Staff No: ${staff.staffNo}<br>
                    Position: ${staff.position}<br>
                    Department: ${staff.department}
                </div>
                <div>
                    <strong>Payment Details:</strong><br>
                    Bank: ${staff.bankName}<br>
                    Account: ${staff.bankAccount}<br>
                    Date: ${new Date().toLocaleDateString('en-GB')}
                </div>
            </div>
            
            <div class="section">
                <h3>EARNINGS</h3>
                <div class="item">
                    <span>Basic Salary</span>
                    <span>TZS ${staff.baseSalary.toLocaleString()}</span>
                </div>
                ${(staff.allowances || []).map(a => `
                    <div class="item">
                        <span>${a.name}</span>
                        <span>TZS ${a.amount.toLocaleString()}</span>
                    </div>
                `).join('')}
                <div class="item total">
                    <span>Gross Salary</span>
                    <span>TZS ${grossSalary.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="section">
                <h3>DEDUCTIONS</h3>
                ${(staff.deductions || []).map(d => `
                    <div class="item">
                        <span>${d.name}</span>
                        <span>TZS ${d.amount.toLocaleString()}</span>
                    </div>
                `).join('')}
                <div class="item total">
                    <span>Total Deductions</span>
                    <span>TZS ${deductionsTotal.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="item total" style="font-size: 18px; background: #f0f0f0; padding: 10px;">
                    <span>NET SALARY</span>
                    <span>TZS ${netSalary.toLocaleString()}</span>
                </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Payslip</button>
                <button onclick="setTimeout(function() { window.close(); }, 1000)" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
        </body>
        </html>
    `);
    payslipWindow.document.close();
}

function printPayslipsBulk() {
    const selectedStaff = getSelectedStaff();
    if (selectedStaff.length === 0) {
        showNotification('Please select staff members to print payslips', 'error');
        return;
    }
    
    selectedStaff.forEach((staffId, index) => {
        setTimeout(() => generatePayslip(staffId), index * 500);
    });
}

// Export functions
function exportCSV() {
    const headers = ['Staff No', 'Full Name', 'Position', 'Department', 'Status', 'Base Salary'];
    const csvContent = [
        headers.join(','),
        ...staffData.map(staff => [
            staff.staffNo,
            `"${staff.fullName}"`,
            `"${staff.position}"`,
            `"${staff.department}"`,
            staff.status,
            staff.baseSalary
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('CSV exported successfully!', 'success');
}

function exportXLSX() {
    if (typeof XLSX === 'undefined') {
        showNotification('Excel export library not loaded', 'error');
        return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(staffData.map(staff => ({
        'Staff No': staff.staffNo,
        'Full Name': staff.fullName,
        'Position': staff.position,
        'Department': staff.department,
        'Base Salary': staff.baseSalary,
        'Status': staff.status,
        'Email': staff.email,
        'Phone': staff.phoneNumber
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Data');
    XLSX.writeFile(workbook, `staff_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Excel file exported successfully!', 'success');
}

function exportPDF() {
    showNotification('PDF export functionality will be implemented soon', 'info');
}

// Import function
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (file.name.endsWith('.csv')) {
                // Handle CSV import
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',');
                
                // Basic CSV parsing (would need more robust parsing for production)
                showNotification('CSV import functionality will be enhanced', 'info');
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Handle Excel import
                showNotification('Excel import functionality will be implemented', 'info');
            }
        } catch (error) {
            showNotification('Error importing file: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Utility functions
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateSelectedStaff();
}

function updateSelectedStaff() {
    const selected = getSelectedStaff();
    // Update UI based on selection if needed
}

function getSelectedStaff() {
    const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}
