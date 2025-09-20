/**
 * School Management System - Authentication Manager
 * Handles login, logout, session management, and user authentication
 */

class AuthManager {
    constructor() {
        this.sessionKey = 'sms_session';
        this.userKey = 'sms_user';
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        // Default users for demo (in production, this would be from backend)
        this.defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'Administrator',
                fullName: 'System Administrator',
                email: 'admin@school.com',
                permissions: ['all']
            },
            {
                id: 2,
                username: 'teacher',
                password: 'teacher123',
                role: 'Teacher',
                fullName: 'John Mwalimu',
                email: 'john@school.com',
                permissions: ['students', 'fees', 'reports']
            },
            {
                id: 3,
                username: 'accountant',
                password: 'account123',
                role: 'Accountant',
                fullName: 'Mary Hesabu',
                email: 'mary@school.com',
                permissions: ['fees', 'payroll', 'procurement', 'reports']
            },
            {
                id: 4,
                username: 'headteacher',
                password: 'head123',
                role: 'Head Teacher',
                fullName: 'Dr. Peter Mkuu',
                email: 'peter@school.com',
                permissions: ['all']
            }
        ];
        
        this.initializeUsers();
    }

    // Initialize users in localStorage if not exists
    initializeUsers() {
        if (!localStorage.getItem('sms_users')) {
            localStorage.setItem('sms_users', JSON.stringify(this.defaultUsers));
        }
    }

    // Get all users from localStorage
    getUsers() {
        return JSON.parse(localStorage.getItem('sms_users') || '[]');
    }

    // Authenticate user credentials
    authenticate(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Create session
            const session = {
                userId: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email,
                permissions: user.permissions,
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString()
            };
            
            // Store session and user data
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            localStorage.setItem(this.userKey, JSON.stringify(user));
            
            return { success: true, user: user, session: session };
        }
        
        return { success: false, message: 'Invalid username or password' };
    }

    // Check if user is authenticated
    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;
        
        // Check if session has expired
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        if (now > expiresAt) {
            this.logout();
            return false;
        }
        
        return true;
    }

    // Get current session
    getSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Error parsing session data:', error);
            return null;
        }
    }

    // Get current user
    getCurrentUser() {
        try {
            const userData = localStorage.getItem(this.userKey);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    // Extend session (refresh expiration time)
    extendSession() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = new Date(Date.now() + this.sessionTimeout).toISOString();
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.userKey);
        
        // Redirect to login page
        const currentPath = window.location.pathname;
        const isInModules = currentPath.includes('/modules/');
        const loginPath = isInModules ? '../login.html' : 'login.html';
        
        window.location.href = loginPath;
    }

    // Check user permissions
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        return user.permissions.includes('all') || user.permissions.includes(permission);
    }

    // Require authentication (redirect to login if not authenticated)
    requireAuth() {
        if (!this.isAuthenticated()) {
            const currentPath = window.location.pathname;
            const isInModules = currentPath.includes('/modules/');
            const loginPath = isInModules ? '../login.html' : 'login.html';
            
            // Store the current page to redirect back after login
            localStorage.setItem('sms_redirect_after_login', window.location.href);
            
            window.location.href = loginPath;
            return false;
        }
        
        // Extend session on activity
        this.extendSession();
        return true;
    }

    // Get redirect URL after login
    getRedirectAfterLogin() {
        const redirectUrl = localStorage.getItem('sms_redirect_after_login');
        localStorage.removeItem('sms_redirect_after_login');
        return redirectUrl;
    }

    // Show user info in UI
    displayUserInfo() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Update user name in navigation if element exists
        const userNameElement = document.querySelector('.user-name, #userName, .current-user');
        if (userNameElement) {
            userNameElement.textContent = user.fullName;
        }

        // Update user role if element exists
        const userRoleElement = document.querySelector('.user-role, #userRole');
        if (userRoleElement) {
            userRoleElement.textContent = user.role;
        }

        // Update user email if element exists
        const userEmailElement = document.querySelector('.user-email, #userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
    }

    // Initialize logout buttons
    initializeLogoutButtons() {
        const logoutButtons = document.querySelectorAll('.logout-btn, #logoutBtn, [data-action="logout"]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (confirm('Are you sure you want to logout?')) {
                    this.logout();
                }
            });
        });
    }

    // Initialize authentication system
    init() {
        // Display user info
        this.displayUserInfo();
        
        // Initialize logout buttons
        this.initializeLogoutButtons();
        
        // Set up session extension on user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        let lastActivity = Date.now();
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                const now = Date.now();
                // Only extend session if more than 5 minutes have passed since last extension
                if (now - lastActivity > 5 * 60 * 1000) {
                    this.extendSession();
                    lastActivity = now;
                }
            }, true);
        });

        // Check session every minute
        setInterval(() => {
            if (!this.isAuthenticated()) {
                alert('Your session has expired. Please login again.');
                this.logout();
            }
        }, 60000); // Check every minute
    }
}

// Create global instance
window.authManager = new AuthManager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not on login page
    if (!window.location.pathname.includes('login.html')) {
        window.authManager.requireAuth();
        window.authManager.init();
    }
});
