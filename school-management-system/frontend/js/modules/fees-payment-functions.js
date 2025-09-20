// Additional functions for fees-payment module
function navigateToPage(url) {
    showNotification('Redirecting...', 'info');
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}

function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            byId('profilePreview').src = imageUrl;
            
            const headerImage = byId('userProfileImage');
            const headerAvatar = byId('userAvatar');
            headerImage.src = imageUrl;
            headerImage.style.display = 'block';
            headerAvatar.style.display = 'none';
            
            localStorage.setItem('user_profile_image', imageUrl);
            showNotification('Profile picture updated', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function updateUserProfile() {
    const fullName = byId('userFullName').value.trim();
    const email = byId('userEmail').value.trim();
    const role = byId('userRole').value.trim();
    
    byId('userName').textContent = fullName || 'Admin';
    byId('userAvatar').textContent = (fullName || 'A').charAt(0).toUpperCase();
    
    const userProfile = {
        fullName: fullName,
        email: email,
        role: role,
        image: localStorage.getItem('user_profile_image') || ''
    };
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    
    showNotification('Profile updated successfully', 'success');
    closeModal('userProfileModal');
}

function loadUserProfile() {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
        try {
            const profile = JSON.parse(saved);
            byId('userFullName').value = profile.fullName || 'Admin User';
            byId('userEmail').value = profile.email || 'admin@school.com';
            byId('userRole').value = profile.role || 'Administrator';
            byId('userName').textContent = profile.fullName || 'Admin';
            byId('userAvatar').textContent = (profile.fullName || 'A').charAt(0).toUpperCase();
            
            if (profile.image) {
                byId('profilePreview').src = profile.image;
                const headerImage = byId('userProfileImage');
                const headerAvatar = byId('userAvatar');
                headerImage.src = profile.image;
                headerImage.style.display = 'block';
                headerAvatar.style.display = 'none';
            }
        } catch (e) {
            console.log('Error loading user profile:', e);
        }
    }
}

function confirmLogout() {
    closeModal('logoutModal');
    if (window.authManager) {
        window.authManager.logout();
    } else {
        // Fallback if authManager not available
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            localStorage.removeItem('sms_session');
            localStorage.removeItem('sms_user');
            window.location.href = '../login.html';
        }, 1000);
    }
}

// Records CRUD
function openAddModal() {
    const modalTitle = byId('recordModalTitle');
    const editIndex = byId('editIndex');
    const studentName = byId('studentName');
    const studentClass = byId('studentClass');
    const amountPaid = byId('amountPaid');
    const receiptNo = byId('receiptNo');
    const paymentDate = byId('paymentDate');
    
    if (modalTitle) modalTitle.textContent = 'Add Payment Record';
    if (editIndex) editIndex.value = '';
    if (studentName) studentName.value = '';
    if (studentClass) studentClass.value = 'Form 1';
    if (amountPaid) amountPaid.value = '';
    if (receiptNo) receiptNo.value = '';
    if (paymentDate) paymentDate.valueAsDate = new Date();
    
    openModal('recordModal');
}

function saveRecord() {
    console.log('saveRecord called');
    
    const name = byId('studentName').value.trim();
    const klass = byId('studentClass').value;
    const amountPaid = Number(byId('amountPaid').value || 0);
    const receiptNo = byId('receiptNo').value.trim() || `RC-${Date.now()}`;
    const paymentDate = byId('paymentDate').value || new Date().toISOString().slice(0,10);
    
    console.log('Form data:', { name, klass, amountPaid, receiptNo, paymentDate });
    
    if (!name) { 
        showNotification('Name is required', 'error'); 
        return; 
    }
    
    const fees = getFees();
    const totalDue = Number(fees[klass] || 0);
    const records = getRecords();
    
    console.log('Current records before save:', records);

    const editId = byId('editIndex').value;
    
    if (editId !== '') {
        // Editing existing record
        const recordIndex = records.findIndex(r => r.id === editId);
        if (recordIndex !== -1) {
            records[recordIndex] = { 
                ...records[recordIndex],
                name, 
                klass, 
                amountPaid, 
                totalDue, 
                receiptNo, 
                paymentDate 
            };
        }
        console.log('Updated existing record');
    } else {
        // Adding new record
        const newRecord = { 
            id: `ID-${Date.now()}`,
            name, 
            klass, 
            amountPaid, 
            totalDue, 
            receiptNo, 
            paymentDate 
        };
        records.push(newRecord);
        console.log('Added new record:', newRecord);
    }
    
    console.log('Records after save:', records);
    setRecords(records);
    closeModal('recordModal');
    showNotification('Record saved successfully!', 'success');
    
    // Call renderAll to update the display
    renderAll();
}

function editRecord(id) {
    const records = getRecords();
    const r = records.find(record => record.id === id);
    if (!r) return;
    byId('recordModalTitle').textContent = 'Edit Payment Record';
    byId('editIndex').value = id;
    byId('studentName').value = r.name;
    byId('studentClass').value = r.klass;
    byId('amountPaid').value = r.amountPaid;
    byId('receiptNo').value = r.receiptNo;
    byId('paymentDate').value = r.paymentDate;
    openModal('recordModal');
}

function askDelete(id) {
    deleteId = id;
    deleteCallback = () => {
        const records = getRecords();
        const updatedRecords = records.filter(record => record.id !== deleteId);
        setRecords(updatedRecords);
        showNotification('Record deleted successfully!', 'success');
        renderAll();
    };
    if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
        deleteCallback();
    }
}

function confirmDelete() { 
    if (deleteCallback) deleteCallback(); 
    closeModal('confirmModal'); 
}

function computeStatus(amountPaid, totalDue) {
    if (amountPaid >= totalDue && totalDue > 0) return 'paid';
    if (amountPaid > 0 && amountPaid < totalDue) return 'partial';
    return 'owing';
}

function renderStatusBadge(status) {
    if (status === 'paid') return `<span class="status-badge status-paid"><i class='fas fa-check-circle'></i> Paid</span>`;
    if (status === 'partial') return `<span class="status-badge status-partial"><i class='fas fa-hourglass-half'></i> Partial</span>`;
    return `<span class="status-badge status-owing"><i class='fas fa-triangle-exclamation'></i> Owing</span>`;
}

// Missing function: getPaymentStatus
function getPaymentStatus(record) {
    return computeStatus(record.amountPaid || 0, record.totalDue || 0);
}

// Missing function: getStatusText
function getStatusText(status) {
    if (status === 'paid') return 'Paid';
    if (status === 'partial') return 'Partial';
    return 'Owing';
}

// Modal functions - openModal and closeModal are already defined in core.js

// Utility functions - byId is already defined in core.js

// Data storage functions - use same keys as core.js
function getRecords() {
    const stored = localStorage.getItem('student_payments');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing payment records:', e);
        }
    }
    // Return empty array - let core.js handle sample data
    return [];
}

function setRecords(records) {
    localStorage.setItem('student_payments', JSON.stringify(records));
}

function getFees() {
    const stored = localStorage.getItem('fees_per_form');
    if (stored) {
        try {
            const defaultFees = { 'Form 1': 300000, 'Form 2': 300000, 'Form 3': 350000, 'Form 4': 350000, 'Form 5': 500000, 'Form 6': 500000 };
            return { ...defaultFees, ...JSON.parse(stored) };
        } catch (e) {
            console.error('Error parsing fee amounts:', e);
        }
    }
    // Return default fees
    return {
        'Form 1': 300000,
        'Form 2': 300000,
        'Form 3': 350000,
        'Form 4': 350000,
        'Form 5': 500000,
        'Form 6': 500000
    };
}

function setFees(fees) {
    localStorage.setItem('fees_per_form', JSON.stringify(fees));
}

// Currency formatting functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
}

// fmtTZS is already defined in core.js

// showNotification is already defined in core.js

// Make renderTable globally available
function renderTable() {
    console.log('renderTable called');
    const records = getRecords();
    console.log('Records:', records);
    
    const tbody = document.getElementById('tableBody');
    if (!tbody) {
        console.error('tableBody element not found');
        return;
    }
    
    // Safe element access with fallbacks
    const searchInput = document.getElementById('searchInput');
    const filterFormEl = document.getElementById('filterForm');
    const filterStatusEl = document.getElementById('filterStatus');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterForm = filterFormEl ? filterFormEl.value : '';
    const filterStatus = filterStatusEl ? filterStatusEl.value : '';

    let filteredRecords = records.filter(record => {
        const matchesSearch = !searchTerm || 
            (record.name && record.name.toLowerCase().includes(searchTerm)) || 
            (record.klass && record.klass.toLowerCase().includes(searchTerm));
        const matchesForm = !filterForm || record.klass === filterForm;
        const matchesStatus = !filterStatus || getPaymentStatus(record) === filterStatus;
        return matchesSearch && matchesForm && matchesStatus;
    });
    
    console.log('Filtered records:', filteredRecords);

    tbody.innerHTML = filteredRecords.map(record => {
        const status = getPaymentStatus(record);
        const balance = record.totalDue - record.amountPaid;
        
        return `
            <tr>
                <td><input type="checkbox" class="row-check" value="${record.id}" data-id="${record.id}" onchange="updateDeleteButton()"></td>
                <td>${record.name}</td>
                <td>${record.klass}</td>
                <td>${formatCurrency(record.amountPaid)}</td>
                <td>${formatCurrency(balance)}</td>
                <td>${formatCurrency(record.totalDue)}</td>
                <td><span class="status-badge status-${status}">${getStatusText(status)}</span></td>
                <td>
                    <div class="row-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewRecord('${record.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="editRecord('${record.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="printReceipt('${record.id}')" title="Print Receipt">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="askDelete('${record.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateCards();
    updateDeleteButton();
}

// Make updateCards globally available
function updateCards() {
    const records = getRecords();
    const totals = records.reduce((acc, r) => {
        acc.collected += Number(r.amountPaid||0);
        const status = computeStatus(r.amountPaid, r.totalDue);
        if (status==='paid') acc.paid += 1; else if (status==='partial') acc.partial += 1; else acc.owing += 1;
        return acc;
    }, { collected: 0, paid: 0, partial: 0, owing: 0 });
    byId('cardTotalCollected').textContent = fmtTZS(totals.collected);
    byId('cardFullyPaid').textContent = String(totals.paid);
    byId('cardPartial').textContent = String(totals.partial);
    byId('cardOwing').textContent = String(totals.owing);
}

function applyQuickFilter(type) {
    if (type === 'paid') byId('filterStatus').value = 'paid';
    else if (type === 'partial') byId('filterStatus').value = 'partial';
    else if (type === 'owing') byId('filterStatus').value = 'owing';
    else byId('filterStatus').value = '';
    renderTable();
}

function toggleSelectAll(chk) {
    document.querySelectorAll('.row-check').forEach(c => c.checked = chk.checked);
}

// Make renderAll globally available
function renderAll() { 
    console.log('renderAll called');
    renderTable();
    updateCards();
}

// Missing functions implementation

// View record details
function viewRecord(id) {
    const record = getRecords().find(r => r.id === id);
    if (!record) return;
    
    const balance = Math.max((record.totalDue || 0) - (record.amountPaid || 0), 0);
    const status = computeStatus(record.amountPaid, record.totalDue);
    
    const detailsHTML = `
        <div class="payment-details">
            <div class="detail-row">
                <span class="detail-label">Student Name:</span>
                <span class="detail-value">${record.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Class:</span>
                <span class="detail-value">${record.klass}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Receipt No:</span>
                <span class="detail-value">${record.receiptNo}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">${new Date(record.paymentDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">${fmtTZS(record.amountPaid)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Due:</span>
                <span class="detail-value">${fmtTZS(record.totalDue)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Balance:</span>
                <span class="detail-value">${fmtTZS(balance)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${renderStatusBadge(status)}</span>
            </div>
        </div>
    `;
    
    byId('paymentDetailsBody').innerHTML = detailsHTML;
    currentViewIndex = id;
    openModal('paymentDetailsModal');
}

// Edit from details modal
function editFromDetails() {
    if (currentViewIndex !== null) {
        closeModal('paymentDetailsModal');
        editRecord(currentViewIndex);
    }
}

// Print from details modal
function printFromDetails() {
    if (currentViewIndex !== null) {
        closeModal('paymentDetailsModal');
        printReceipt(currentViewIndex);
    }
}

// Print receipt function
function printReceipt(id) {
    const record = getRecords().find(r => r.id === id);
    if (!record) return;
    
    currentPrintIndex = id;
    byId('managerName').value = '';
    byId('receiptNotes').value = '';
    openModal('managerReceiptModal');
}

// Confirm print receipt
function confirmPrintReceipt() {
    const record = getRecords().find(r => r.id === currentPrintIndex);
    if (!record) return;
    
    const managerName = byId('managerName').value.trim() || 'School Manager';
    const notes = byId('receiptNotes').value.trim();
    const balance = Math.max((record.totalDue || 0) - (record.amountPaid || 0), 0);
    
    const receiptWindow = window.open('', '_blank', 'width=800,height=600');
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Receipt - ${record.receiptNo}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .section { margin-bottom: 15px; }
                .item { display: flex; justify-content: space-between; padding: 3px 0; }
                .total { font-weight: bold; border-top: 1px solid #333; }
                .footer { margin-top: 30px; text-align: center; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SCHOOL MANAGEMENT SYSTEM</h1>
                <h2>PAYMENT RECEIPT</h2>
                <p>Receipt No: ${record.receiptNo}</p>
            </div>
            
            <div class="info">
                <div>
                    <strong>Student Details:</strong><br>
                    Name: ${record.name}<br>
                    Class: ${record.klass}<br>
                    Date: ${new Date(record.paymentDate).toLocaleDateString()}
                </div>
                <div>
                    <strong>Payment Summary:</strong><br>
                    Amount Paid: ${fmtTZS(record.amountPaid)}<br>
                    Balance: ${fmtTZS(balance)}<br>
                    Status: ${computeStatus(record.amountPaid, record.totalDue).toUpperCase()}
                </div>
            </div>
            
            <div class="section">
                <div class="item total" style="font-size: 18px; background: #f0f0f0; padding: 10px;">
                    <span>AMOUNT PAID</span>
                    <span>${fmtTZS(record.amountPaid)}</span>
                </div>
            </div>
            
            ${notes ? `<div class="section"><strong>Notes:</strong> ${notes}</div>` : ''}
            
            <div class="footer">
                <p>Received by: ${managerName}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <br>
                <button onclick="window.print()" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
                <button onclick="setTimeout(function() { window.close(); }, 1000)" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
        </body>
        </html>
    `);
    receiptWindow.document.close();
    
    closeModal('managerReceiptModal');
    showNotification('Receipt generated successfully!', 'success');
}

// Print receipts in bulk
function printReceiptBulk() {
    const checked = Array.from(document.querySelectorAll('.row-check:checked'));
    if (checked.length === 0) {
        showNotification('Please select records to print receipts', 'error');
        return;
    }
    
    checked.forEach((checkbox, i) => {
        const id = checkbox.dataset.id;
        setTimeout(() => printReceipt(id), i * 400);
    });
}

// Save fees amounts
function saveFees() {
    const fees = {
        'Form 1': Number(byId('feeF1').value) || 0,
        'Form 2': Number(byId('feeF2').value) || 0,
        'Form 3': Number(byId('feeF3').value) || 0,
        'Form 4': Number(byId('feeF4').value) || 0,
        'Form 5': Number(byId('feeF5').value) || 0,
        'Form 6': Number(byId('feeF6').value) || 0
    };
    
    setFees(fees);
    closeModal('feesModal');
    showNotification('Fee amounts updated successfully!', 'success');
    
    // Update existing records with new fee amounts
    const records = getRecords();
    records.forEach(record => {
        record.totalDue = fees[record.klass] || 0;
    });
    setRecords(records);
    renderAll();
}

// Load fees into modal
function loadFeesModal() {
    const fees = getFees();
    byId('feeF1').value = fees['Form 1'] || 0;
    byId('feeF2').value = fees['Form 2'] || 0;
    byId('feeF3').value = fees['Form 3'] || 0;
    byId('feeF4').value = fees['Form 4'] || 0;
    byId('feeF5').value = fees['Form 5'] || 0;
    byId('feeF6').value = fees['Form 6'] || 0;
}

// Export functions
function exportCSV() {
    const records = getRecords();
    if (records.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }
    
    const headers = ['Name', 'Class', 'Amount Paid', 'Total Due', 'Balance', 'Status', 'Receipt No', 'Payment Date'];
    const csvContent = [
        headers.join(','),
        ...records.map(record => {
            const balance = Math.max((record.totalDue || 0) - (record.amountPaid || 0), 0);
            const status = computeStatus(record.amountPaid, record.totalDue);
            return [
                `"${record.name}"`,
                `"${record.klass}"`,
                record.amountPaid || 0,
                record.totalDue || 0,
                balance,
                status,
                `"${record.receiptNo}"`,
                record.paymentDate
            ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('CSV exported successfully!', 'success');
}

function exportXLSX() {
    if (typeof XLSX === 'undefined') {
        showNotification('Excel export library not loaded', 'error');
        return;
    }
    
    const records = getRecords();
    if (records.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(records.map(record => {
        const balance = Math.max((record.totalDue || 0) - (record.amountPaid || 0), 0);
        const status = computeStatus(record.amountPaid, record.totalDue);
        return {
            'Name': record.name,
            'Class': record.klass,
            'Amount Paid': record.amountPaid || 0,
            'Total Due': record.totalDue || 0,
            'Balance': balance,
            'Status': status,
            'Receipt No': record.receiptNo,
            'Payment Date': record.paymentDate
        };
    }));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fees & Payments');
    XLSX.writeFile(workbook, `fees_payments_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Excel file exported successfully!', 'success');
}

function exportPDF() {
    showNotification('PDF export functionality will be implemented soon', 'info');
}

// Import function - make it globally available
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (file.name.endsWith('.csv')) {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    showNotification('CSV file appears to be empty', 'error');
                    return;
                }
                
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const records = getRecords();
                let imported = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    if (values.length >= 3) {
                        const name = values[0];
                        const klass = values[1];
                        const amountPaid = Number(values[2]) || 0;
                        const fees = getFees();
                        const totalDue = fees[klass] || 0;
                        
                        if (name && klass) {
                            records.push({
                                id: `ID-${Date.now()}-${i}`,
                                name: name,
                                klass: klass,
                                amountPaid: amountPaid,
                                totalDue: totalDue,
                                receiptNo: `RC-${Date.now()}-${i}`,
                                paymentDate: new Date().toISOString().split('T')[0]
                            });
                            imported++;
                        }
                    }
                }
                
                setRecords(records);
                renderAll();
                showNotification(`Successfully imported ${imported} records`, 'success');
                
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                if (typeof XLSX === 'undefined') {
                    showNotification('Excel import library not loaded', 'error');
                    return;
                }
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                const records = getRecords();
                let imported = 0;
                const fees = getFees();
                rows.forEach((row, idx) => {
                    const name = row.Name || row['Full Name'] || row['Student Name'] || '';
                    const klass = row.Class || row.Klass || row.Form || '';
                    const amountPaid = Number(row['Amount Paid'] || row.Paid || row.Amount || 0) || 0;
                    const totalDue = Number(row['Total Due'] || fees[klass] || 0) || 0;
                    const receiptNo = row['Receipt No'] || row['Receipt'] || `RC-${Date.now()}-${idx}`;
                    const paymentDate = row['Payment Date'] || new Date().toISOString().split('T')[0];
                    if (name && klass) {
                        records.push({
                            id: `ID-${Date.now()}-${idx}`,
                            name,
                            klass,
                            amountPaid,
                            totalDue,
                            receiptNo,
                            paymentDate
                        });
                        imported++;
                    }
                });
                setRecords(records);
                renderAll();
                showNotification(`Successfully imported ${imported} Excel record(s)`, 'success');
            }
        } catch (error) {
            showNotification('Error importing file: ' + error.message, 'error');
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
    
    // Reset file input
    event.target.value = '';
}

// Initialize module when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fees-payment module initializing...');
    
    // Wait a bit for core.js to initialize sample data
    setTimeout(() => {
        renderTable();
        updateCards();
        console.log('Fees-payment module initialized');
    }, 100);
});

// Make functions globally available
window.renderTable = renderTable;
window.renderAll = renderAll;
window.updateCards = updateCards;
window.handleImport = handleImport;
window.openAddModal = openAddModal;

// Bulk delete functionality
function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#tableBody input.row-check');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateDeleteButton();
}

function updateDeleteButton() {
    const selectedCheckboxes = document.querySelectorAll('#tableBody input.row-check:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    if (selectedCheckboxes.length > 0) {
        deleteBtn.style.display = 'inline-flex';
        deleteBtn.innerHTML = `<i class="fas fa-trash"></i><span>Delete Selected (${selectedCheckboxes.length})</span>`;
    } else {
        deleteBtn.style.display = 'none';
    }
    
    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('#tableBody input.row-check');
    if (allCheckboxes.length > 0) {
        selectAllCheckbox.checked = selectedCheckboxes.length === allCheckboxes.length;
        selectAllCheckbox.indeterminate = selectedCheckboxes.length > 0 && selectedCheckboxes.length < allCheckboxes.length;
    }
}

function deleteSelectedRecords() {
    const selectedCheckboxes = document.querySelectorAll('#tableBody input.row-check:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showNotification('No records selected', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)? This action cannot be undone.`)) {
        const records = getRecords();
        const updatedRecords = records.filter(record => !selectedIds.includes(record.id));
        setRecords(updatedRecords);
        
        showNotification(`${selectedIds.length} record(s) deleted successfully!`, 'success');
        renderTable();
        
        // Reset select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
}

// Charts functionality
let chartsVisible = false;
let statusChart, formChart, trendChart;

function toggleCharts() {
    const chartsSection = document.getElementById('chartsSection');
    const toggleBtn = document.getElementById('toggleChartsBtn');
    
    chartsVisible = !chartsVisible;
    
    if (chartsVisible) {
        chartsSection.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-chart-bar"></i><span>Hide Charts</span>';
        initializeCharts();
    } else {
        chartsSection.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-chart-bar"></i><span>Show Charts</span>';
        destroyCharts();
    }
}

function initializeCharts() {
    const records = getRecords();
    
    // Status Distribution Chart
    createStatusChart(records);
    
    // Collections by Form Chart
    createFormChart(records);
    
    // Monthly Trend Chart
    createTrendChart(records);
}

function createStatusChart(records) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    const statusCounts = records.reduce((acc, record) => {
        const status = getPaymentStatus(record);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    
    if (statusChart) statusChart.destroy();
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fully Paid', 'Partial Payment', 'Outstanding'],
            datasets: [{
                data: [
                    statusCounts.paid || 0,
                    statusCounts.partial || 0,
                    statusCounts.owing || 0
                ],
                backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function createFormChart(records) {
    const ctx = document.getElementById('formChart');
    if (!ctx) return;
    
    const formCollections = records.reduce((acc, record) => {
        const form = record.klass;
        acc[form] = (acc[form] || 0) + record.amountPaid;
        return acc;
    }, {});
    
    if (formChart) formChart.destroy();
    
    formChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(formCollections).sort(),
            datasets: [{
                label: 'Collections (TZS)',
                data: Object.values(formCollections),
                backgroundColor: '#4361ee',
                borderColor: '#3f37c9',
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

function createTrendChart(records) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Group payments by month
    const monthlyData = records.reduce((acc, record) => {
        const date = new Date(record.paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + record.amountPaid;
        return acc;
    }, {});
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyCollections = sortedMonths.map(month => monthlyData[month]);
    
    if (trendChart) trendChart.destroy();
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(month => {
                const [year, monthNum] = month.split('-');
                const date = new Date(year, monthNum - 1);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Monthly Collections',
                data: monthlyCollections,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
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

function destroyCharts() {
    if (statusChart) {
        statusChart.destroy();
        statusChart = null;
    }
    if (formChart) {
        formChart.destroy();
        formChart = null;
    }
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    loadFeesModal();
    renderAll();
    
    // Override the modal opening for fees modal to load current values
    const originalOpenModal = openModal;
    window.openFeesModal = function() {
        loadFeesModal();
        originalOpenModal('feesModal');
    };
});
