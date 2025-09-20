const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No authentication token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure they still exist and are active
        const userResult = await query(
            'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return res.status(401).json({
                error: 'Account disabled',
                message: 'Your account has been disabled'
            });
        }

        // Update last login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Add user info to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please login again'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            message: 'An error occurred during authentication'
        });
    }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

// Permission-based authorization middleware
const authorizePermissions = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'You must be logged in to access this resource'
                });
            }

            // Define role permissions
            const rolePermissions = {
                admin: {
                    students: ['create', 'read', 'update', 'delete'],
                    fees: ['create', 'read', 'update', 'delete'],
                    staff: ['create', 'read', 'update', 'delete'],
                    payroll: ['create', 'read', 'update', 'delete'],
                    procurement: ['create', 'read', 'update', 'delete'],
                    inventory: ['create', 'read', 'update', 'delete'],
                    reports: ['read'],
                    settings: ['create', 'read', 'update', 'delete']
                },
                head_teacher: {
                    students: ['create', 'read', 'update', 'delete'],
                    fees: ['read', 'update'],
                    staff: ['create', 'read', 'update'],
                    payroll: ['read', 'update'],
                    procurement: ['read', 'update'],
                    inventory: ['read'],
                    reports: ['read'],
                    settings: ['read', 'update']
                },
                teacher: {
                    students: ['read', 'update'],
                    fees: ['read'],
                    staff: ['read'],
                    payroll: [],
                    procurement: [],
                    inventory: [],
                    reports: ['read'],
                    settings: ['read']
                },
                accountant: {
                    students: ['read'],
                    fees: ['create', 'read', 'update', 'delete'],
                    staff: ['read'],
                    payroll: ['create', 'read', 'update', 'delete'],
                    procurement: ['create', 'read', 'update', 'delete'],
                    inventory: ['read', 'update'],
                    reports: ['read'],
                    settings: ['read']
                }
            };

            const userPermissions = rolePermissions[req.user.role];
            
            if (!userPermissions || !userPermissions[resource] || !userPermissions[resource].includes(action)) {
                return res.status(403).json({
                    error: 'Access forbidden',
                    message: `You don't have permission to ${action} ${resource}`
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                error: 'Authorization failed',
                message: 'An error occurred during authorization'
            });
        }
    };
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userResult = await query(
                'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
                req.user = {
                    id: userResult.rows[0].id,
                    username: userResult.rows[0].username,
                    email: userResult.rows[0].email,
                    fullName: userResult.rows[0].full_name,
                    role: userResult.rows[0].role
                };
            }
        }

        next();
    } catch (error) {
        // For optional auth, we don't return errors, just continue without user context
        next();
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizePermissions,
    optionalAuth
};