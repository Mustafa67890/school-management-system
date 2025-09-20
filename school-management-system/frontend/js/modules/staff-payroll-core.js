// Staff & Payroll Module - Core Functions
// Global Variables
let staffData = [];
let payrollRuns = [];
let currentEditingStaff = null;

// Translation system
const translations = {
    en: {
        staff_payroll: "Staff & Payroll",
        procurement: "Procurement",
        inventory: "Inventory",
        reports: "Reports",
        settings: "Settings",
        logout: "Logout",
        total_staff: "Total Staff",
        active_staff: "Active Staff",
        on_leave: "On Leave",
        monthly_payroll: "Monthly Payroll",
        add_staff: "Add Staff",
        import_staff: "Import Staff",
        export_csv: "Export CSV",
        export_excel: "Export Excel",
        export_pdf: "Export PDF",
        run_payroll: "Run Payroll",
        search_staff: "Search staff...",
        all_departments: "All Departments",
        all_status: "All Status",
        staff_no: "Staff No",
        full_name: "Full Name",
        position: "Position",
        department: "Department",
        status: "Status",
        actions: "Actions"
    },
    sw: {
        staff_payroll: "Wafanyakazi na Mishahara",
        procurement: "Ununuzi",
        inventory: "Hesabu",
        reports: "Ripoti",
        settings: "Mipangilio",
        logout: "Ondoka",
        total_staff: "Wafanyakazi Wote",
        active_staff: "Wafanyakazi Hai",
        on_leave: "Likizoni",
        monthly_payroll: "Mishahara ya Mwezi",
        add_staff: "Ongeza Mfanyakazi",
        import_staff: "Leta Wafanyakazi",
        export_csv: "Hamisha CSV",
        export_excel: "Hamisha Excel",
        export_pdf: "Hamisha PDF",
        run_payroll: "Endesha Mishahara",
        search_staff: "Tafuta mfanyakazi...",
        all_departments: "Idara Zote",
        all_status: "Hali Zote",
        staff_no: "Namba ya Mfanyakazi",
        full_name: "Jina Kamili",
        position: "Nafasi",
        department: "Idara",
        status: "Hali",
        actions: "Vitendo"
    }
};

let currentLanguage = 'en';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
    renderTable();
    updateCards();
    updateTime();
    setInterval(updateTime, 1000);
    
    // Setup event listeners
    setupEventListeners();
});

// Load sample data
function loadSampleData() {
    staffData = [
        {
            id: 1, 
            staffNo: 'STF001', 
            fullName: 'John Kamau', 
            position: 'Teacher', 
            department: 'Teaching', 
            subjects: ['Mathematics', 'Physics'], 
            classes: ['Form3A', 'Form4A'], 
            employmentType: 'Permanent',
            salaryType: 'Monthly', 
            baseSalary: 800000, 
            phoneNumber: '0754123456',
            email: 'john.kamau@school.co.tz', 
            nationalId: '19850615-12345-67890-12',
            bankName: 'CRDB Bank', 
            bankAccount: '****6789', 
            dateOfEmployment: '2020-01-15',
            status: 'active', 
            address: 'Dar es Salaam, Tanzania',
            allowances: [{name: 'Transport', amount: 50000}, {name: 'Housing', amount: 100000}],
            deductions: [{name: 'Pension', amount: 40000}, {name: 'Tax', amount: 80000}]
        },
        {
            id: 2, 
            staffNo: 'STF002', 
            fullName: 'Mary Mwalimu', 
            position: 'Head Teacher',
            department: 'Management', 
            subjects: ['English', 'Kiswahili'],
            classes: ['Form1A', 'Form2B'], 
            employmentType: 'Permanent',
            salaryType: 'Monthly', 
            baseSalary: 1200000, 
            phoneNumber: '0765987654',
            email: 'mary.mwalimu@school.co.tz', 
            nationalId: '19800312-98765-43210-98',
            bankName: 'NMB Bank', 
            bankAccount: '****4321', 
            dateOfEmployment: '2018-08-01',
            status: 'active', 
            address: 'Arusha, Tanzania',
            allowances: [{name: 'Transport', amount: 80000}, {name: 'Housing', amount: 150000}],
            deductions: [{name: 'Pension', amount: 60000}, {name: 'Tax', amount: 120000}]
        }
    ];
}

// Setup event listeners
function setupEventListeners() {
    // Search and filter event listeners
    const searchInput = document.getElementById('searchInput');
    const filterDepartment = document.getElementById('filterDepartment');
    const filterStatus = document.getElementById('filterStatus');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderTable);
    }
    
    if (filterDepartment) {
        filterDepartment.addEventListener('change', renderTable);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', renderTable);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });
}

// Update time display
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = now.toLocaleDateString('en-GB');
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${timeString} | ${dateString}`;
    }
}

// Update dashboard cards
function updateCards() {
    const totalStaff = staffData.length;
    const activeStaff = staffData.filter(s => s.status === 'active').length;
    const onLeave = staffData.filter(s => s.status === 'inactive').length;
    const monthlyPayroll = staffData.reduce((sum, s) => sum + (s.baseSalary || 0), 0);

    const totalElement = document.getElementById('cardTotalStaff');
    const activeElement = document.getElementById('cardActiveStaff');
    const leaveElement = document.getElementById('cardInactiveStaff');
    const payrollElement = document.getElementById('cardMonthlyPayroll');

    if (totalElement) totalElement.textContent = totalStaff;
    if (activeElement) activeElement.textContent = activeStaff;
    if (leaveElement) leaveElement.textContent = onLeave;
    if (payrollElement) payrollElement.textContent = `TZS ${monthlyPayroll.toLocaleString()}`;
}

// Language toggle functionality
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
    const languageText = document.getElementById('language-text');
    if (languageText) {
        languageText.textContent = currentLanguage.toUpperCase();
    }
    updateTranslations();
}

// Update translations
function updateTranslations() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
    
    if (mainContent) {
        mainContent.classList.toggle('sidebar-collapsed');
    }
}

// Quick filter functionality
function applyQuickFilter(filterType) {
    const filterStatus = document.getElementById('filterStatus');
    if (!filterStatus) return;
    
    switch(filterType) {
        case 'all':
            filterStatus.value = '';
            break;
        case 'active':
            filterStatus.value = 'active';
            break;
        case 'inactive':
            filterStatus.value = 'inactive';
            break;
        default:
            filterStatus.value = '';
    }
    
    renderTable();
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// API Integration Functions
async function loadStaffFromAPI() {
    try {
        showLoading(true);
        
        const response = await window.apiClient.getStaff();
        
        if (response.success && response.data) {
            // Convert API data to frontend format
            staffData = response.data.map(staff => ({
                id: staff.id,
                staffNo: staff.staff_number,
                fullName: staff.full_name,
                position: staff.position,
                department: staff.department,
                subjects: staff.subjects ? staff.subjects.split(',') : [],
                classes: staff.classes ? staff.classes.split(',') : [],
                employmentType: staff.employment_type,
                salaryType: staff.salary_type,
                baseSalary: parseFloat(staff.base_salary) || 0,
                phone: staff.phone,
                email: staff.email,
                nationalId: staff.national_id,
                bankName: staff.bank_name,
                bankAccount: staff.bank_account,
                dateOfEmployment: staff.date_of_employment,
                status: staff.status,
                address: staff.address,
                allowances: staff.allowances ? JSON.parse(staff.allowances) : {},
                deductions: staff.deductions ? JSON.parse(staff.deductions) : {},
                photo: staff.photo_url || 'https://via.placeholder.com/100x100/4361ee/fff?text=' + staff.full_name.charAt(0)
            }));
            
            showNotification(`Loaded ${staffData.length} staff records from database`, 'success');
            
        } else {
            throw new Error('Failed to load staff from API');
        }
        
    } catch (error) {
        console.warn('Failed to load staff from API, using sample data:', error);
        initializeSampleData();
        showNotification('Using demo data - API connection failed', 'warning');
    } finally {
        showLoading(false);
    }
}

async function saveStaffMember(staffMemberData) {
    try {
        showLoading(true);
        
        const apiData = {
            staff_number: staffMemberData.staffNo,
            full_name: staffMemberData.fullName,
            position: staffMemberData.position,
            department: staffMemberData.department,
            subjects: staffMemberData.subjects.join(','),
            classes: staffMemberData.classes.join(','),
            employment_type: staffMemberData.employmentType,
            salary_type: staffMemberData.salaryType,
            base_salary: parseFloat(staffMemberData.baseSalary),
            phone: staffMemberData.phone,
            email: staffMemberData.email,
            national_id: staffMemberData.nationalId,
            bank_name: staffMemberData.bankName,
            bank_account: staffMemberData.bankAccount,
            date_of_employment: staffMemberData.dateOfEmployment,
            status: staffMemberData.status,
            address: staffMemberData.address,
            allowances: JSON.stringify(staffMemberData.allowances || {}),
            deductions: JSON.stringify(staffMemberData.deductions || {})
        };
        
        let response;
        if (staffMemberData.id) {
            response = await window.apiClient.updateStaff(staffMemberData.id, apiData);
        } else {
            response = await window.apiClient.createStaff(apiData);
        }
        
        if (response.success) {
            showNotification('Staff member saved successfully!', 'success');
            await loadStaffFromAPI(); // Reload data
            return true;
        } else {
            throw new Error(response.message || 'Failed to save staff member');
        }
        
    } catch (error) {
        console.error('Failed to save staff member:', error);
        showNotification('Failed to save staff member. Please try again.', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

async function deleteStaffMember(staffId) {
    try {
        showLoading(true);
        
        const response = await window.apiClient.deleteStaff(staffId);
        
        if (response.success) {
            showNotification('Staff member deleted successfully!', 'success');
            await loadStaffFromAPI(); // Reload data
            return true;
        } else {
            throw new Error(response.message || 'Failed to delete staff member');
        }
        
    } catch (error) {
        console.error('Failed to delete staff member:', error);
        showNotification('Failed to delete staff member. Please try again.', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

async function loadPayrollFromAPI() {
    try {
        const response = await window.apiClient.getPayrollRuns();
        
        if (response.success && response.data) {
            payrollRuns = response.data.map(payroll => ({
                id: payroll.id,
                period: payroll.period,
                month: payroll.month,
                year: payroll.year,
                status: payroll.status,
                totalAmount: parseFloat(payroll.total_amount) || 0,
                createdAt: payroll.created_at,
                approvedAt: payroll.approved_at
            }));
            
            return true;
        } else {
            throw new Error('Failed to load payroll from API');
        }
        
    } catch (error) {
        console.warn('Failed to load payroll from API:', error);
        return false;
    }
}

// Show/hide loading state
function showLoading(show) {
    const loadingElements = document.querySelectorAll('.card, .table-container');
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

// Initialize sample data (fallback)
function initializeSampleData() {
    staffData = [
        {
            id: 1,
            staffNo: 'ST001',
            fullName: 'John Kamau',
            position: 'Mathematics Teacher',
            department: 'Mathematics',
            subjects: ['Mathematics', 'Physics'],
            classes: ['Form 1A', 'Form 2B'],
            employmentType: 'Permanent',
            salaryType: 'Monthly',
            baseSalary: 800000,
            phone: '+255 712 345 678',
            email: 'john.kamau@school.ac.tz',
            nationalId: '19850312-12345-67890',
            bankName: 'CRDB Bank',
            bankAccount: '0150123456789',
            dateOfEmployment: '2020-01-15',
            status: 'active',
            address: 'P.O. Box 123, Dar es Salaam',
            allowances: { transport: 50000, housing: 100000 },
            deductions: { nhif: 15000, nssf: 20000 },
            photo: 'https://via.placeholder.com/100x100/4361ee/fff?text=JK'
        },
        {
            id: 2,
            staffNo: 'ST002',
            fullName: 'Mary Mwalimu',
            position: 'Head Teacher',
            department: 'Administration',
            subjects: ['English', 'Literature'],
            classes: ['Form 3A', 'Form 4A'],
            employmentType: 'Permanent',
            salaryType: 'Monthly',
            baseSalary: 1200000,
            phone: '+255 713 456 789',
            email: 'mary.mwalimu@school.ac.tz',
            nationalId: '19780825-98765-43210',
            bankName: 'NMB Bank',
            bankAccount: '20150987654321',
            dateOfEmployment: '2018-03-01',
            status: 'active',
            address: 'P.O. Box 456, Dar es Salaam',
            allowances: { transport: 80000, housing: 150000, responsibility: 200000 },
            deductions: { nhif: 20000, nssf: 30000, tax: 180000 },
            photo: 'https://via.placeholder.com/100x100/e74c3c/fff?text=MM'
        }
    ];
}

// Navigation function (if needed for menu items)
function navigateToPage(url) {
    window.location.href = url;
}
