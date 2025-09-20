// Core functionality for fees-payment module
// Multi-language translations
const translations = {
    en: {
        'delete_selected': 'Delete Selected',
        'show_charts': 'Show Charts',
        'hide_charts': 'Hide Charts',
        dashboard: 'Dashboard',
        students: 'Students',
        fees_payments: 'Fees & Payments',
        staff_payroll: 'Staff & Payroll',
        procurement: 'Procurement',
        inventory: 'Inventory',
        reports: 'Reports',
        settings: 'Settings',
        user_management: 'User Management',
        fees_payments_module: 'Fees & Payments Module',
        logout: 'Logout',
        total_fees_collected: 'Total Fees Collected',
        overall_collections: 'Overall collections across Forms 1-6',
        fully_paid: 'Fully Paid',
        students_zero_balance: 'Students with zero balance',
        partial_payments: 'Partial Payments',
        students_paid_partially: 'Students who paid partially',
        owing: 'Owing',
        students_outstanding_fees: 'Students with outstanding fees',
        add_new_record: 'Add New Record',
        set_fee_amounts: 'Set Fee Amounts',
        import: 'Import',
        print_receipts: 'Print Receipts',
        profile_picture: 'Profile Picture',
        full_name: 'Full Name',
        email: 'Email',
        role: 'Role'
    },
    sw: {
        dashboard: 'Dashibodi',
        students: 'Wanafunzi',
        fees_payments: 'Ada na Malipo',
        staff_payroll: 'Wafanyakazi na Mishahara',
        procurement: 'Ununuzi',
        inventory: 'Hifadhi',
        reports: 'Ripoti',
        settings: 'Mipangilio',
        user_management: 'Usimamizi wa Watumiaji',
        fees_payments_module: 'Moduli ya Ada na Malipo',
        logout: 'Toka',
        total_fees_collected: 'Jumla ya Ada Zilizokusanywa',
        overall_collections: 'Ukusanyaji wa jumla kwa Kidato 1-6',
        fully_paid: 'Amelipa Kamili',
        students_zero_balance: 'Wanafunzi bila deni',
        partial_payments: 'Malipo ya Nusu',
        students_paid_partially: 'Wanafunzi waliolipa nusu',
        owing: 'Ana Deni',
        students_outstanding_fees: 'Wanafunzi wenye deni',
        add_new_record: 'Ongeza Rekodi Mpya',
        set_fee_amounts: 'Weka Kiasi cha Ada',
        import: 'Ingiza',
        print_receipts: 'Chapisha Risiti',
        profile_picture: 'Picha ya Wasifu',
        full_name: 'Jina Kamili',
        email: 'Barua Pepe',
        role: 'Nafasi'
    }
};

// State variables
let currentLanguage = 'en';
let deleteIndex = null;
let deleteCallback = null;
let currentViewIndex = null;
let currentPrintIndex = null;

const defaultFees = { 'Form 1': 300000, 'Form 2': 300000, 'Form 3': 350000, 'Form 4': 350000, 'Form 5': 500000, 'Form 6': 500000 };

// Utility functions
function getFees() {
    const saved = localStorage.getItem('fees_per_form');
    if (!saved) return { ...defaultFees };
    try { return { ...defaultFees, ...JSON.parse(saved) }; } catch { return { ...defaultFees }; }
}

function setFees(obj) { localStorage.setItem('fees_per_form', JSON.stringify(obj)); }

function getRecords() {
    const saved = localStorage.getItem('student_payments');
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
}

function setRecords(arr) { localStorage.setItem('student_payments', JSON.stringify(arr)); }

const fmtTZS = (n) => 'TZS ' + (Number(n)||0).toLocaleString('en-TZ');
const byId = (id) => document.getElementById(id);

// Time and UI functions
function updateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    byId('current-time').textContent = now.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'sw-TZ', options);
}

function toggleSidebar() {
    const sidebar = byId('sidebar');
    const mainContent = byId('mainContent');
    const toggleIcon = document.querySelector('.sidebar-toggle i');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');
    toggleIcon.className = sidebar.classList.contains('collapsed') ? 'fas fa-bars' : 'fas fa-times';
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
    byId('language-text').textContent = currentLanguage.toUpperCase();
    updateTranslations();
    updateTime();
}

function updateTranslations() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

function openModal(id) { byId(id).classList.add('show'); }
function closeModal(id) { byId(id).classList.remove('show'); }

function showNotification(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    const icon = type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle';
    el.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// Sample data initialization
function initializeSampleData() {
    const existingRecords = getRecords();
    if (existingRecords.length === 0) {
        const sampleRecords = [
            {
                id: 'ID-1',
                name: 'John Mwangi',
                klass: 'Form 1',
                amountPaid: 200000,
                totalDue: 300000,
                receiptNo: 'RC-001',
                paymentDate: '2024-01-15'
            },
            {
                id: 'ID-2',
                name: 'Mary Kiprotich',
                klass: 'Form 2',
                amountPaid: 300000,
                totalDue: 300000,
                receiptNo: 'RC-002',
                paymentDate: '2024-01-20'
            },
            {
                id: 'ID-3',
                name: 'Peter Mwalimu',
                klass: 'Form 3',
                amountPaid: 150000,
                totalDue: 350000,
                receiptNo: 'RC-003',
                paymentDate: '2024-01-25'
            },
            {
                id: 'ID-4',
                name: 'Grace Mwangi',
                klass: 'Form 4',
                amountPaid: 0,
                totalDue: 350000,
                receiptNo: 'RC-004',
                paymentDate: '2024-02-01'
            },
            {
                id: 'ID-5',
                name: 'David Kimani',
                klass: 'Form 5',
                amountPaid: 500000,
                totalDue: 500000,
                receiptNo: 'RC-005',
                paymentDate: '2024-02-05'
            }
        ];
        setRecords(sampleRecords);
    }
}

// API Integration Functions
async function loadFeesFromAPI() {
    try {
        showLoading(true);
        
        const response = await window.apiClient.getFeePayments();
        
        if (response.success && response.data) {
            // Convert API data to frontend format
            const apiRecords = response.data.map(payment => ({
                id: payment.student_id,
                name: payment.student_name,
                klass: payment.class,
                amountPaid: parseFloat(payment.amount_paid) || 0,
                totalDue: parseFloat(payment.total_fees) || 0,
                receiptNo: payment.receipt_number,
                paymentDate: payment.payment_date,
                feeType: payment.fee_type,
                paymentMethod: payment.payment_method,
                status: payment.status
            }));
            
            setRecords(apiRecords);
            showNotification(`Loaded ${apiRecords.length} fee records from database`, 'success');
            
        } else {
            throw new Error('Failed to load fee records from API');
        }
        
    } catch (error) {
        console.warn('Failed to load fees from API, using sample data:', error);
        initializeSampleData();
        showNotification('Using demo data - API connection failed', 'warning');
    } finally {
        showLoading(false);
    }
}

async function saveFeePayment(paymentData) {
    try {
        showLoading(true);
        
        const apiData = {
            student_id: paymentData.studentId,
            fee_type: paymentData.feeType,
            amount: parseFloat(paymentData.amount),
            payment_method: paymentData.paymentMethod,
            payment_date: paymentData.paymentDate,
            receipt_number: paymentData.receiptNumber,
            notes: paymentData.notes
        };
        
        const response = await window.apiClient.createFeePayment(apiData);
        
        if (response.success) {
            showNotification('Payment recorded successfully!', 'success');
            await loadFeesFromAPI(); // Reload data
            return true;
        } else {
            throw new Error(response.message || 'Failed to save payment');
        }
        
    } catch (error) {
        console.error('Failed to save payment:', error);
        showNotification('Failed to save payment. Please try again.', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

async function deleteFeePayment(paymentId) {
    try {
        showLoading(true);
        
        const response = await window.apiClient.deleteFeePayment(paymentId);
        
        if (response.success) {
            showNotification('Payment deleted successfully!', 'success');
            await loadFeesFromAPI(); // Reload data
            return true;
        } else {
            throw new Error(response.message || 'Failed to delete payment');
        }
        
    } catch (error) {
        console.error('Failed to delete payment:', error);
        showNotification('Failed to delete payment. Please try again.', 'error');
        return false;
    } finally {
        showLoading(false);
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Try to load from API first, fallback to sample data
    if (window.apiClient) {
        loadFeesFromAPI();
    } else {
        // Wait for API client to load
        setTimeout(() => {
            if (window.apiClient) {
                loadFeesFromAPI();
            } else {
                initializeSampleData();
            }
        }, 1000);
    }
    
    updateTime();
    setInterval(updateTime, 1000);
});
