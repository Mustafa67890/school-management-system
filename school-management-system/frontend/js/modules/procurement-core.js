// Procurement Module Core JavaScript
// Global variables and data storage
let procurementData = {
    goodsReceiving: [],
    invoices: [],
    budgets: [],
    purchaseOrders: []
};

let currentTab = 'receiving';
let currentLanguage = 'EN';

// Sample data initialization
function initializeSampleData() {
    // Sample Goods Receiving Data
    procurementData.goodsReceiving = [
        {
            id: 1,
            poNumber: 'PO-2024-001',
            supplier: 'Stationery Plus Ltd',
            department: 'administration',
            items: 'Exercise books (200), Pens (100), Chalk (50 boxes)',
            expected: 350,
            received: 350,
            status: 'complete',
            date: '2024-01-15',
            value: 450000
        },
        {
            id: 2,
            poNumber: 'PO-2024-002',
            supplier: 'Science Equipment Co',
            department: 'science',
            items: 'Microscopes (5), Test tubes (200), Chemicals (various)',
            expected: 205,
            received: 200,
            status: 'partial',
            date: '2024-01-20',
            value: 850000
        },
        {
            id: 3,
            poNumber: 'PO-2024-003',
            supplier: 'Library Books Suppliers',
            department: 'library',
            items: 'Textbooks (150), Reference books (50)',
            expected: 200,
            received: 0,
            status: 'pending',
            date: '2024-01-25',
            value: 600000
        }
    ];

    // Sample Invoice Data
    procurementData.invoices = [
        {
            id: 1,
            invoiceNumber: 'INV-2024-001',
            supplier: 'Stationery Plus Ltd',
            poReference: 'PO-2024-001',
            amount: 450000,
            dueDate: '2024-02-15',
            status: 'paid',
            paymentMethod: 'bank',
            date: '2024-01-16'
        },
        {
            id: 2,
            invoiceNumber: 'INV-2024-002',
            supplier: 'Science Equipment Co',
            poReference: 'PO-2024-002',
            amount: 850000,
            dueDate: '2024-02-20',
            status: 'approved',
            paymentMethod: 'bank',
            date: '2024-01-21'
        },
        {
            id: 3,
            invoiceNumber: 'INV-2024-003',
            supplier: 'Maintenance Supplies',
            poReference: 'PO-2024-004',
            amount: 320000,
            dueDate: '2024-02-10',
            status: 'pending',
            paymentMethod: 'mpesa',
            date: '2024-01-18'
        }
    ];

    // Sample Budget Data
    procurementData.budgets = [
        {
            id: 1,
            department: 'science',
            name: 'Science Department',
            annual: 1500000,
            utilized: 850000,
            remaining: 650000,
            period: '2024'
        },
        {
            id: 2,
            department: 'library',
            name: 'Library',
            annual: 800000,
            utilized: 600000,
            remaining: 200000,
            period: '2024'
        },
        {
            id: 3,
            department: 'administration',
            name: 'Administration',
            annual: 1200000,
            utilized: 450000,
            remaining: 750000,
            period: '2024'
        },
        {
            id: 4,
            department: 'maintenance',
            name: 'Maintenance',
            annual: 1000000,
            utilized: 1050000,
            remaining: -50000,
            period: '2024'
        }
    ];
}

// Initialize the module when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
    switchTab('receiving');
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Initialize all components
    updateReceivingCards();
    renderReceivingTable();
    updateInvoiceCards();
    renderInvoiceTable();
    updateBudgetCards();
    renderBudgetChart();
    renderBudgetItems();
    renderReportsCharts();
    
    // Set today's date for date inputs
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // Generate auto PO number
    generatePONumber();
});

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${dateString} ${timeString}`;
    }
}

// Tab switching function
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab button
    const activeButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Update current tab
    currentTab = tabName;
    
    // Load tab-specific data
    switch(tabName) {
        case 'receiving':
            updateReceivingCards();
            renderReceivingTable();
            break;
        case 'invoices':
            updateInvoiceCards();
            renderInvoiceTable();
            break;
        case 'budget':
            updateBudgetCards();
            renderBudgetChart();
            renderBudgetItems();
            break;
        case 'reports':
            renderReportsCharts();
            break;
    }
}

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');
}

// Language toggle functionality
function toggleLanguage() {
    currentLanguage = currentLanguage === 'EN' ? 'SW' : 'EN';
    document.getElementById('language-text').textContent = currentLanguage;
    
    // Here you would implement actual translation logic
    showNotification(`Language switched to ${currentLanguage}`, 'info');
}

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Special handling for specific modals
        if (modalId === 'newOrderModal') {
            generatePONumber();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form data
        clearModalForm(modalId);
    }
}

function clearModalForm(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'date') {
                input.value = new Date().toISOString().split('T')[0];
            } else if (input.type === 'number') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else if (!input.readOnly) {
                input.value = '';
            }
        });
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return '#2ecc71';
        case 'error': return '#e74c3c';
        case 'warning': return '#f39c12';
        default: return '#4361ee';
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0
    }).format(amount).replace('TZS', 'TZS ');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function generatePONumber() {
    const year = new Date().getFullYear();
    const nextNumber = (procurementData.goodsReceiving.length + 1).toString().padStart(3, '0');
    const poNumber = `PO-${year}-${nextNumber}`;
    
    const poInput = document.getElementById('newPONumber');
    if (poInput) {
        poInput.value = poNumber;
    }
    
    return poNumber;
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge status-pending">Pending</span>',
        'partial': '<span class="status-badge status-partial">Partial</span>',
        'complete': '<span class="status-badge status-complete">Complete</span>',
        'approved': '<span class="status-badge status-approved">Approved</span>',
        'paid': '<span class="status-badge status-paid">Paid</span>'
    };
    return badges[status] || status;
}

// User profile and logout functions
function updateUserProfile() {
    const fullName = document.getElementById('userFullName').value;
    const email = document.getElementById('userEmail').value;
    
    // Update display
    document.getElementById('userName').textContent = fullName.split(' ')[0];
    
    showNotification('Profile updated successfully', 'success');
    closeModal('userProfileModal');
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

// Navigation function
function navigateToPage(url) {
    window.location.href = url;
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 15px;
    }
    
    .notification-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(notificationStyles);

// API Integration Functions
async function loadProcurementDataFromAPI() {
    try {
        showLoading(true);
        
        // Load purchase orders
        const poResponse = await window.apiClient.getPurchaseOrders();
        if (poResponse.success && poResponse.data) {
            procurementData.purchaseOrders = poResponse.data.map(po => ({
                id: po.id,
                poNumber: po.po_number,
                supplier: po.supplier_name,
                department: po.department,
                items: po.description,
                totalAmount: parseFloat(po.total_amount) || 0,
                status: po.status,
                date: po.created_at,
                approvedBy: po.approved_by,
                notes: po.notes
            }));
        }
        
        // Load suppliers
        const supplierResponse = await window.apiClient.getSuppliers();
        if (supplierResponse.success && supplierResponse.data) {
            procurementData.suppliers = supplierResponse.data.map(supplier => ({
                id: supplier.id,
                name: supplier.name,
                contact: supplier.contact_person,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                category: supplier.category,
                status: supplier.status
            }));
        }
        
        showNotification('Procurement data loaded from database', 'success');
        
    } catch (error) {
        console.warn('Failed to load procurement data from API, using sample data:', error);
        initializeSampleData();
        showNotification('Using demo data - API connection failed', 'warning');
    } finally {
        showLoading(false);
    }
}

async function savePurchaseOrder(poData) {
    try {
        showLoading(true);
        
        const apiData = {
            po_number: poData.poNumber,
            supplier_id: poData.supplierId,
            department: poData.department,
            description: poData.items,
            total_amount: parseFloat(poData.totalAmount),
            status: poData.status || 'pending',
            notes: poData.notes
        };
        
        let response;
        if (poData.id) {
            response = await window.apiClient.updatePurchaseOrder(poData.id, apiData);
        } else {
            response = await window.apiClient.createPurchaseOrder(apiData);
        }
        
        if (response.success) {
            showNotification('Purchase order saved successfully!', 'success');
            await loadProcurementDataFromAPI(); // Reload data
            return true;
        } else {
            throw new Error(response.message || 'Failed to save purchase order');
        }
        
    } catch (error) {
        console.error('Failed to save purchase order:', error);
        showNotification('Failed to save purchase order. Please try again.', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

async function deletePurchaseOrder(poId) {
    try {
        showLoading(true);
        
        const response = await window.apiClient.deletePurchaseOrder(poId);
        
        if (response.success) {
            showNotification('Purchase order deleted successfully!', 'success');
            await loadProcurementDataFromAPI(); // Reload data
            return true;
        } else {
            throw new Error(response.message || 'Failed to delete purchase order');
        }
        
    } catch (error) {
        console.error('Failed to delete purchase order:', error);
        showNotification('Failed to delete purchase order. Please try again.', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// Show/hide loading state
function showLoading(show) {
    const loadingElements = document.querySelectorAll('.card, .table-container, .tab-content');
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
