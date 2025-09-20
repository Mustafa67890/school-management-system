// Global variables
let currentLanguage = 'en';
let currentCardType = '';
let deleteCallback = null;

// Translation data
const translations = {
    en: {
        dashboard_title: 'Dashboard Overview',
        total_students: 'Total Students',
        fees_collected: 'Fees Collected',
        payroll: 'Payroll',
        procurement: 'Procurement',
        students_growth: '5.2% from last term',
        fees_paid: 'TZS 32.1M Paid',
        fees_due: 'TZS 16.6M Due',
        payroll_pending: 'TZS 2.1M Pending',
        requests_approved: '3 Requests Approved',
        fee_collection_overview: 'Fee Collection Overview',
        payment_status: 'Payment Status',
        last_7_days: 'Last 7 Days',
        last_30_days: 'Last 30 Days',
        this_term: 'This Term',
        recent_activities: 'Recent Activities',
        view_all: 'View All',
        payment_activity: 'John Doe paid TZS 150,000 for Term 1 fees',
        salary_activity: 'Salary processed for Mr. Johnson',
        purchase_activity: 'New textbooks purchased for Form 5',
        user_profile: 'User Profile',
        full_name: 'Full Name',
        email: 'Email',
        role: 'Role',
        delete: 'Delete',
        update: 'Update',
        confirm_logout: 'Confirm Logout',
        logout_confirmation: 'Are you sure you want to logout?',
        cancel: 'Cancel',
        logout: 'Logout',
        all_activities: 'All Activities',
        activity: 'Activity',
        type: 'Type',
        date: 'Date',
        actions: 'Actions',
        confirm_delete: 'Confirm Delete',
        delete_confirmation: 'Are you sure you want to delete this item?',
        edit: 'Edit'
    },
    sw: {
        dashboard_title: 'Muhtasari wa Dashibodi',
        total_students: 'Wanafunzi Wote',
        fees_collected: 'Ada Zilizokusanywa',
        payroll: 'Malipo ya Mshahara',
        procurement: 'Ununuzi',
        students_growth: '5.2% kutoka muhula uliopita',
        fees_paid: 'TZS 32.1M Imelipwa',
        fees_due: 'TZS 16.6M Inayotakiwa',
        payroll_pending: 'TZS 2.1M Inasubiri',
        requests_approved: 'Maombi 3 Yamekubaliwa',
        fee_collection_overview: 'Muhtasari wa Ukusanyaji wa Ada',
        payment_status: 'Hali ya Malipo',
        last_7_days: 'Siku 7 Zilizopita',
        last_30_days: 'Siku 30 Zilizopita',
        this_term: 'Muhula Huu',
        recent_activities: 'Shughuli za Hivi Karibuni',
        view_all: 'Ona Zote',
        payment_activity: 'John Doe alilipa TZS 150,000 kwa ada za Muhula 1',
        salary_activity: 'Mshahara wa Bw. Johnson umetolewa',
        purchase_activity: 'Vitabu vipya vimenunuliwa kwa Kidato cha 5',
        user_profile: 'Wasifu wa Mtumiaji',
        full_name: 'Jina Kamili',
        email: 'Barua pepe',
        role: 'Jukumu',
        delete: 'Futa',
        update: 'Sasisha',
        confirm_logout: 'Thibitisha Kutoka',
        logout_confirmation: 'Una uhakika unataka kutoka?',
        cancel: 'Ghairi',
        logout: 'Toka',
        all_activities: 'Shughuli Zote',
        activity: 'Shughuli',
        type: 'Aina',
        date: 'Tarehe',
        actions: 'Vitendo',
        confirm_delete: 'Thibitisha Kufuta',
        delete_confirmation: 'Una uhakika unataka kufuta kipengele hiki?',
        edit: 'Hariri'
    }
};

// Update current time
function updateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('current-time').textContent = now.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'sw-TZ', options);
}

setInterval(updateTime, 1000);
updateTime();

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleIcon = document.querySelector('.sidebar-toggle i');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.className = 'fas fa-bars';
    } else {
        toggleIcon.className = 'fas fa-times';
    }
}

// Language toggle functionality
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
    const languageText = document.getElementById('language-text');
    languageText.textContent = currentLanguage.toUpperCase();
    
    // Update all translatable elements
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    // Update time format
    updateTime();
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// User profile functions
function openUserProfileModal() {
    openModal('userProfileModal');
}

function updateUserProfile() {
    const fullName = document.getElementById('userFullName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    
    // Update user info in header
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userAvatar').textContent = fullName.charAt(0).toUpperCase();
    
    closeModal('userProfileModal');
    showNotification('User profile updated successfully', 'success');
}

function deleteUserProfile() {
    document.getElementById('deleteMessage').textContent = 
        currentLanguage === 'en' ? 'Are you sure you want to delete this user profile?' : 
        'Una uhakika unataka kufuta wasifu wa mtumiaji huyu?';
    deleteCallback = () => {
        closeModal('userProfileModal');
        showNotification('User profile deleted successfully', 'success');
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    };
    openModal('deleteModal');
}

// Logout functions
function openLogoutModal() {
    openModal('logoutModal');
}

function confirmLogout() {
    closeModal('logoutModal');
    showNotification('Logged out successfully', 'success');
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Card functions
function openCardModal(cardType) {
    currentCardType = cardType;
    const modal = document.getElementById('cardModal');
    const title = document.getElementById('cardModalTitle');
    const body = document.getElementById('cardModalBody');
    
    const cardData = {
        students: {
            title: currentLanguage === 'en' ? 'Students Details' : 'Maelezo ya Wanafunzi',
            content: currentLanguage === 'en' ? 
                '<p>Total Students: 1,254</p><p>New Enrollments: 45</p><p>Graduated: 12</p>' :
                '<p>Wanafunzi Wote: 1,254</p><p>Usajili Mpya: 45</p><p>Wamehitimu: 12</p>'
        },
        fees: {
            title: currentLanguage === 'en' ? 'Fees Details' : 'Maelezo ya Ada',
            content: currentLanguage === 'en' ?
                '<p>Total Fees: TZS 48.7M</p><p>Paid: TZS 32.1M</p><p>Due: TZS 16.6M</p>' :
                '<p>Ada Zote: TZS 48.7M</p><p>Zilizolipwa: TZS 32.1M</p><p>Zinazotakiwa: TZS 16.6M</p>'
        },
        payroll: {
            title: currentLanguage === 'en' ? 'Payroll Details' : 'Maelezo ya Mshahara',
            content: currentLanguage === 'en' ?
                '<p>Total Payroll: TZS 12.3M</p><p>Processed: TZS 10.2M</p><p>Pending: TZS 2.1M</p>' :
                '<p>Mshahara Wote: TZS 12.3M</p><p>Umetolewa: TZS 10.2M</p><p>Unasubiri: TZS 2.1M</p>'
        },
        procurement: {
            title: currentLanguage === 'en' ? 'Procurement Details' : 'Maelezo ya Ununuzi',
            content: currentLanguage === 'en' ?
                '<p>Total Procurement: TZS 5.2M</p><p>Approved: 3 requests</p><p>Pending: 2 requests</p>' :
                '<p>Ununuzi Wote: TZS 5.2M</p><p>Umeidhinishwa: Maombi 3</p><p>Yanasubiri: Maombi 2</p>'
        }
    };
    
    title.textContent = cardData[cardType].title;
    body.innerHTML = cardData[cardType].content;
    openModal('cardModal');
}

function editCard() {
    showNotification('Card edit functionality would be implemented here', 'success');
    closeModal('cardModal');
}

function deleteCard() {
    document.getElementById('deleteMessage').textContent = 
        currentLanguage === 'en' ? 'Are you sure you want to delete this card?' : 
        'Una uhakika unataka kufuta kadi hii?';
    deleteCallback = () => {
        closeModal('cardModal');
        showNotification('Card deleted successfully', 'success');
    };
    openModal('deleteModal');
}

// Activities functions
function openActivitiesModal() {
    const tableBody = document.getElementById('activitiesTableBody');
    const activities = [
        {
            activity: currentLanguage === 'en' ? 'John Doe paid TZS 150,000 for Term 1 fees' : 'John Doe alilipa TZS 150,000 kwa ada za Muhula 1',
            type: currentLanguage === 'en' ? 'Payment' : 'Malipo',
            date: 'Today at 10:30 AM'
        },
        {
            activity: currentLanguage === 'en' ? 'Salary processed for Mr. Johnson' : 'Mshahara wa Bw. Johnson umetolewa',
            type: currentLanguage === 'en' ? 'Salary' : 'Mshahara',
            date: 'Yesterday at 2:45 PM'
        },
        {
            activity: currentLanguage === 'en' ? 'New textbooks purchased for Form 5' : 'Vitabu vipya vimenunuliwa kwa Kidato cha 5',
            type: currentLanguage === 'en' ? 'Purchase' : 'Ununuzi',
            date: 'September 10, 2025'
        }
    ];
    
    tableBody.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.activity}</td>
            <td>${activity.type}</td>
            <td>${activity.date}</td>
            <td>
                <button class="btn btn-primary" onclick="editActivity(${activities.indexOf(activity)})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteActivity(${activities.indexOf(activity)})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    openModal('activitiesModal');
}

function editActivity(index) {
    showNotification('Activity updated successfully', 'success');
}

function deleteActivity(index) {
    document.getElementById('deleteMessage').textContent = 
        currentLanguage === 'en' ? 'Are you sure you want to delete this activity?' : 
        'Una uhakika unataka kufuta shughuli hii?';
    deleteCallback = () => {
        showNotification('Activity deleted successfully', 'success');
    };
    openModal('deleteModal');
}

// Chart functions
function toggleChart(chartId) {
    const chart = document.getElementById(chartId);
    const button = event.target.closest('button');
    const icon = button.querySelector('i');
    
    if (chart.style.display === 'none') {
        chart.style.display = 'block';
        icon.className = 'fas fa-eye';
    } else {
        chart.style.display = 'none';
        icon.className = 'fas fa-eye-slash';
    }
}

function updateChartData(period) {
    // This would update chart data based on the selected period
    showNotification(`Chart data updated for ${period}`, 'success');
}

// Delete confirmation
function confirmDelete() {
    if (deleteCallback) {
        deleteCallback();
        deleteCallback = null;
    }
    closeModal('deleteModal');
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
        </div>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize charts
document.addEventListener('DOMContentLoaded', function() {
    // Fee Collection Chart
    const feeCtx = document.getElementById('feeChart').getContext('2d');
    const feeChart = new Chart(feeCtx, {
        type: 'bar',
        data: {
            labels: ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'],
            datasets: [{
                label: 'Fees Collected (TZS)',
                data: [12500000, 9800000, 11200000, 8700000, 6500000, 0],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
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
    
    // Payment Status Chart
    const statusCtx = document.getElementById('paymentStatusChart').getContext('2d');
    const statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fully Paid', 'Partial Payment', 'Not Paid'],
            datasets: [{
                data: [45, 25, 30],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(220, 53, 69, 0.7)'
                ],
                borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
});
