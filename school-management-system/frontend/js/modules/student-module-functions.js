// Student Module Functions - Part 2
function saveStudent() {
    const form = document.getElementById('studentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const studentData = {
        admissionNo: document.getElementById('admissionNo').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        studentClass: document.getElementById('studentClass').value,
        stream: document.getElementById('stream').value,
        guardianName: document.getElementById('guardianName').value,
        guardianPhone: document.getElementById('guardianPhone').value,
        guardianEmail: document.getElementById('guardianEmail').value,
        relationship: document.getElementById('relationship').value,
        address: document.getElementById('address').value,
        medicalConditions: document.getElementById('medicalConditions').value,
        status: document.getElementById('status').value,
        photo: document.getElementById('photoPreview').src,
        admissionDate: new Date().toISOString().split('T')[0],
        balance: Math.floor(Math.random() * 200000)
    };

    if (currentStudentId) {
        // Update existing student
        const index = students.findIndex(s => s.id === currentStudentId);
        if (index !== -1) {
            students[index] = { ...students[index], ...studentData };
            showNotification('Student updated successfully!', 'success');
        }
    } else {
        // Add new student
        studentData.id = Date.now();
        students.push(studentData);
        showNotification('Student added successfully!', 'success');
    }

    closeModal('studentModal');
    filteredStudents = [...students];
    updateDashboardCards();
    renderTable();
    updateCharts();
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    currentStudentId = id;
    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    
    // Populate form
    document.getElementById('admissionNo').value = student.admissionNo;
    document.getElementById('firstName').value = student.firstName;
    document.getElementById('lastName').value = student.lastName;
    document.getElementById('dateOfBirth').value = student.dateOfBirth;
    document.getElementById('gender').value = student.gender;
    document.getElementById('studentClass').value = student.studentClass;
    document.getElementById('stream').value = student.stream;
    document.getElementById('guardianName').value = student.guardianName;
    document.getElementById('guardianPhone').value = student.guardianPhone;
    document.getElementById('guardianEmail').value = student.guardianEmail;
    document.getElementById('relationship').value = student.relationship;
    document.getElementById('address').value = student.address;
    document.getElementById('medicalConditions').value = student.medicalConditions;
    document.getElementById('status').value = student.status;
    document.getElementById('photoPreview').src = student.photo;

    closeModal('studentProfileModal');
    openModal('studentModal');
}

let studentToDelete = null;

function deleteStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    studentToDelete = id;
    
    // Populate delete confirmation modal
    document.getElementById('deleteStudentPhoto').src = student.photo;
    document.getElementById('deleteStudentName').textContent = `${student.firstName} ${student.lastName}`;
    document.getElementById('deleteStudentDetails').textContent = `${student.admissionNo} - ${student.studentClass}${student.stream ? ' ' + student.stream : ''}`;
    
    openModal('deleteConfirmModal');
}

function confirmDelete() {
    if (studentToDelete) {
        students = students.filter(s => s.id !== studentToDelete);
        filteredStudents = [...students];
        updateDashboardCards();
        renderTable();
        updateCharts();
        showNotification('Student deleted successfully!', 'success');
        studentToDelete = null;
    }
    closeModal('deleteConfirmModal');
}

function viewStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    currentStudentId = id;
    
    // Populate profile modal
    document.getElementById('profilePhoto').src = student.photo;
    document.getElementById('profileName').textContent = `${student.firstName} ${student.lastName}`;
    document.getElementById('profileAdmNo').textContent = `Admission No: ${student.admissionNo}`;
    document.getElementById('profileClass').textContent = `Class: ${student.studentClass}${student.stream ? ' ' + student.stream : ''}`;
    document.getElementById('profileStatus').textContent = `Status: ${student.status}`;
    document.getElementById('profileDOB').textContent = student.dateOfBirth;
    document.getElementById('profileGender').textContent = student.gender;
    document.getElementById('profileAddress').textContent = student.address || 'Not provided';
    document.getElementById('profileMedical').textContent = student.medicalConditions || 'None';
    document.getElementById('profileGuardianName').textContent = student.guardianName;
    document.getElementById('profileGuardianPhone').textContent = student.guardianPhone;
    document.getElementById('profileGuardianEmail').textContent = student.guardianEmail || 'Not provided';
    document.getElementById('profileRelationship').textContent = student.relationship || 'Not specified';

    openModal('studentProfileModal');
}

// Dashboard and table functions
function updateDashboardCards() {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const inactive = students.filter(s => s.status === 'inactive').length;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const newThisMonth = students.filter(s => {
        const admissionDate = new Date(s.admissionDate);
        return admissionDate.getMonth() === thisMonth && admissionDate.getFullYear() === thisYear;
    }).length;

    document.getElementById('cardTotalStudents').textContent = total;
    document.getElementById('cardActiveStudents').textContent = active;
    document.getElementById('cardInactiveStudents').textContent = inactive;
    document.getElementById('cardNewStudents').textContent = newThisMonth;
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    // Apply filters
    let filtered = [...students];
    
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const searchAdmNo = document.getElementById('searchAdmNo').value.toLowerCase();
    const filterClass = document.getElementById('filterClass').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const searchPhone = document.getElementById('searchPhone').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    if (searchName) {
        filtered = filtered.filter(s => 
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchName)
        );
    }
    if (searchAdmNo) {
        filtered = filtered.filter(s => s.admissionNo.toLowerCase().includes(searchAdmNo));
    }
    if (filterClass) {
        filtered = filtered.filter(s => s.studentClass === filterClass);
    }
    if (filterStatus) {
        filtered = filtered.filter(s => s.status === filterStatus);
    }
    if (searchPhone) {
        filtered = filtered.filter(s => s.guardianPhone.includes(searchPhone));
    }
    if (dateFrom) {
        filtered = filtered.filter(s => s.admissionDate >= dateFrom);
    }
    if (dateTo) {
        filtered = filtered.filter(s => s.admissionDate <= dateTo);
    }

    filteredStudents = filtered;

    tbody.innerHTML = filtered.map(student => `
        <tr>
            <td><input type="checkbox" value="${student.id}"></td>
            <td>${student.admissionNo}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${student.photo}" alt="${student.firstName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                    ${student.firstName} ${student.lastName}
                </div>
            </td>
            <td>${student.studentClass}${student.stream ? ' ' + student.stream : ''}</td>
            <td>${student.guardianName}</td>
            <td>${student.guardianPhone}</td>
            <td>TSh ${student.balance.toLocaleString()}</td>
            <td>
                <span class="status-badge ${student.status === 'active' ? 'status-active' : 'status-inactive'}">
                    <i class="fas fa-circle"></i>
                    ${student.status}
                </span>
            </td>
            <td>
                <div class="row-actions">
                    <button class="btn" style="background: #4895ef; color: white; padding: 6px 10px; border-radius: 5px;" onclick="viewStudent(${student.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn" style="background: #2ecc71; color: white; padding: 6px 10px; border-radius: 5px;" onclick="editStudent(${student.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" style="background: #e74c3c; color: white; padding: 6px 10px; border-radius: 5px;" onclick="deleteStudent(${student.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter functions
function toggleFilters() {
    const filtersPanel = document.getElementById('filtersPanel');
    filtersPanel.classList.toggle('collapsed');
}

function clearFilters() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchAdmNo').value = '';
    document.getElementById('filterClass').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    renderTable();
}

function applyQuickFilter(type) {
    clearFilters();
    if (type === 'active') {
        document.getElementById('filterStatus').value = 'active';
    } else if (type === 'inactive') {
        document.getElementById('filterStatus').value = 'inactive';
    } else if (type === 'new') {
        const thisMonth = new Date().toISOString().slice(0, 7) + '-01';
        document.getElementById('dateFrom').value = thisMonth;
    }
    renderTable();
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

// Export functions
function exportCSV() {
    const headers = ['Admission No', 'First Name', 'Last Name', 'Class', 'Guardian', 'Phone', 'Status'];
    const csvContent = [
        headers.join(','),
        ...filteredStudents.map(s => [
            s.admissionNo,
            s.firstName,
            s.lastName,
            s.studentClass + (s.stream ? ' ' + s.stream : ''),
            s.guardianName,
            s.guardianPhone,
            s.status
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('CSV exported successfully!', 'success');
}

function exportXLSX() {
    const data = filteredStudents.map(s => ({
        'Admission No': s.admissionNo,
        'First Name': s.firstName,
        'Last Name': s.lastName,
        'Class': s.studentClass + (s.stream ? ' ' + s.stream : ''),
        'Guardian': s.guardianName,
        'Phone': s.guardianPhone,
        'Email': s.guardianEmail,
        'Status': s.status,
        'Balance': s.balance
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students.xlsx');
    showNotification('Excel file exported successfully!', 'success');
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Student List', 20, 20);
    
    let y = 40;
    doc.setFontSize(10);
    
    filteredStudents.forEach(student => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(`${student.admissionNo} - ${student.firstName} ${student.lastName}`, 20, y);
        doc.text(`Class: ${student.studentClass}${student.stream ? ' ' + student.stream : ''}`, 20, y + 10);
        doc.text(`Guardian: ${student.guardianName} (${student.guardianPhone})`, 20, y + 20);
        doc.text(`Status: ${student.status}`, 20, y + 30);
        
        y += 45;
    });
    
    doc.save('students.pdf');
    showNotification('PDF exported successfully!', 'success');
}

// Charts
function initializeCharts() {
    createClassDistributionChart();
    createAdmissionsChart();
    createStatusChart();
}

function createClassDistributionChart() {
    const ctx = document.getElementById('classDistributionChart').getContext('2d');
    const classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
    const data = classes.map(cls => students.filter(s => s.studentClass === cls).length);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: classes,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4361ee', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createAdmissionsChart() {
    const ctx = document.getElementById('admissionsChart').getContext('2d');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const data = months.map((month, index) => {
        return students.filter(s => {
            const admissionDate = new Date(s.admissionDate);
            return admissionDate.getMonth() === index && admissionDate.getFullYear() === currentYear;
        }).length;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'New Admissions',
                data: data,
                backgroundColor: '#4361ee'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    const active = students.filter(s => s.status === 'active').length;
    const inactive = students.filter(s => s.status === 'inactive').length;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
                data: [active, inactive],
                backgroundColor: ['#2ecc71', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateCharts() {
    // Reinitialize charts with new data
    initializeCharts();
}

function toggleCharts() {
    const chartsSection = document.getElementById('chartsSection');
    const toggleText = document.getElementById('chartsToggleText');
    
    chartsVisible = !chartsVisible;
    chartsSection.style.display = chartsVisible ? 'block' : 'none';
    toggleText.textContent = chartsVisible ? translations[currentLanguage].hide_charts : translations[currentLanguage].show_charts;
}
