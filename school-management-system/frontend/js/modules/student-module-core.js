// Student Module Core JavaScript - Part 1
// Global variables
let students = [];
let filteredStudents = [];
let currentStudentId = null;
let currentLanguage = 'en';
let chartsVisible = false;

// Translation object
const translations = {
    en: {
        // Sidebar
        dashboard: "Dashboard",
        students: "Students",
        fees_payments: "Fees & Payments",
        staff_payroll: "Staff & Payroll",
        procurement: "Procurement",
        inventory: "Inventory",
        reports: "Reports",
        settings: "Settings",
        user_management: "User Management",
        
        // Header
        student_module: "Student Module",
        logout: "Logout",
        
        // Cards
        total_students: "Total Students",
        active_students: "Active Students",
        inactive_students: "Inactive Students",
        new_admissions: "New Admissions",
        all_enrolled_students: "All enrolled students Forms 1-6",
        currently_enrolled: "Currently enrolled students",
        graduated_transferred: "Graduated or transferred",
        this_month: "New students this month",
        
        // Buttons
        add_new_student: "Add New Student",
        filters: "Filters",
        import: "Import",
        generate_id: "Generate ID",
        print_cards: "Print Cards",
        
        // Table headers
        adm_no: "Adm No",
        name: "Name",
        class: "Class",
        guardian: "Guardian",
        phone: "Phone",
        balance: "Balance",
        status: "Status",
        actions: "Actions",
        
        // Status
        active: "Active",
        inactive: "Inactive",
        
        // Modal titles
        add_student: "Add New Student",
        edit_student: "Edit Student",
        student_profile: "Student Profile",
        confirm_delete: "Confirm Delete",
        admin_profile: "Admin Profile"
    },
    sw: {
        // Sidebar
        dashboard: "Dashibodi",
        students: "Wanafunzi",
        fees_payments: "Ada na Malipo",
        staff_payroll: "Wafanyakazi na Mishahara",
        procurement: "Ununuzi",
        inventory: "Hifadhi",
        reports: "Ripoti",
        settings: "Mipangilio",
        user_management: "Usimamizi wa Watumiaji",
        
        // Header
        student_module: "Moduli ya Wanafunzi",
        logout: "Toka",
        
        // Cards
        total_students: "Jumla ya Wanafunzi",
        active_students: "Wanafunzi Hai",
        inactive_students: "Wanafunzi Wasiofanya Kazi",
        new_admissions: "Wanafunzi Wapya",
        all_enrolled_students: "Wanafunzi wote waliosajiliwa Kidato 1-6",
        currently_enrolled: "Wanafunzi waliosajiliwa sasa",
        graduated_transferred: "Waliomaliza au kuhamishwa",
        this_month: "Wanafunzi wapya mwezi huu"
    }
};

// Sample student data
const sampleStudents = [
    {
        id: 1,
        admissionNo: 'ADM001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2008-05-15',
        gender: 'Male',
        studentClass: 'Form 4',
        stream: 'A',
        guardianName: 'Jane Doe',
        guardianPhone: '+255712345678',
        guardianEmail: 'jane.doe@email.com',
        relationship: 'Mother',
        address: 'P.O. Box 123, Dar es Salaam',
        medicalConditions: 'None',
        status: 'active',
        photo: 'https://via.placeholder.com/100x100/4361ee/fff?text=JD',
        admissionDate: '2021-01-15',
        balance: 150000
    },
    {
        id: 2,
        admissionNo: 'ADM002',
        firstName: 'Mary',
        lastName: 'Johnson',
        dateOfBirth: '2009-03-22',
        gender: 'Female',
        studentClass: 'Form 3',
        stream: 'B',
        guardianName: 'Robert Johnson',
        guardianPhone: '+255723456789',
        guardianEmail: 'robert.johnson@email.com',
        relationship: 'Father',
        address: 'P.O. Box 456, Arusha',
        medicalConditions: 'Asthma',
        status: 'active',
        photo: 'https://via.placeholder.com/100x100/e74c3c/fff?text=MJ',
        admissionDate: '2022-01-10',
        balance: 75000
    }
];

// Initialize the application
function initializeApp() {
    students = [...sampleStudents];
    filteredStudents = [...students];
    updateTime();
    setInterval(updateTime, 1000);
    updateDashboardCards();
    renderTable();
    initializeCharts();
}

// Time functions
function updateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate().toString().padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const dateTimeString = `${dayName}, ${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
    document.getElementById('current-time').textContent = dateTimeString;
}

// Sidebar functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    document.body.style.overflow = 'auto';
    if (modalId === 'studentModal') {
        resetStudentForm();
    }
}

// Student CRUD functions
function resetStudentForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('photoPreview').src = 'https://via.placeholder.com/100x100/ddd/999?text=Photo';
    document.getElementById('studentModalTitle').textContent = 'Add New Student';
    currentStudentId = null;
}

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photoPreview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Utility functions
function showNotification(message, type = 'info') {
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

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
    document.getElementById('language-text').textContent = currentLanguage.toUpperCase();
    translatePage();
}

function translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

function navigateToPage(url) {
    window.location.href = url;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../login.html';
    }
    closeModal('logoutModal');
}
