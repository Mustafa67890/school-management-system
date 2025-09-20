const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

class User extends BaseModel {
    constructor() {
        super('users');
    }

    // Create user with hashed password
    async create(userData, client = null) {
        try {
            // Hash password before saving
            if (userData.password) {
                const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
                userData.password_hash = await bcrypt.hash(userData.password, saltRounds);
                delete userData.password; // Remove plain password
            }

            return await super.create(userData, client);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Find user by username
    async findByUsername(username) {
        try {
            const result = await query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    // Find user by email
    async findByEmail(email) {
        try {
            const result = await query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Authenticate user
    async authenticate(username, password) {
        try {
            const user = await this.findByUsername(username);
            if (!user) {
                return null;
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return null;
            }

            // Update last login
            await this.updateById(user.id, { last_login: new Date() });

            // Return user without password hash
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            console.error('Error authenticating user:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await this.updateById(userId, { password_hash: newPasswordHash });
            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    // Get user profile (without sensitive data)
    async getProfile(userId) {
        try {
            const result = await query(
                `SELECT id, username, email, full_name, role, phone, is_active, 
                        last_login, created_at, updated_at 
                 FROM users WHERE id = $1`,
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(userId, profileData) {
        try {
            // Remove sensitive fields that shouldn't be updated via profile
            const { password, password_hash, role, is_active, ...allowedFields } = profileData;
            
            return await this.updateById(userId, allowedFields);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Get users by role
    async findByRole(role) {
        try {
            const result = await query(
                `SELECT id, username, email, full_name, role, phone, is_active, 
                        last_login, created_at 
                 FROM users WHERE role = $1 AND is_active = true
                 ORDER BY full_name`,
                [role]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding users by role:', error);
            throw error;
        }
    }

    // Activate/Deactivate user
    async setActiveStatus(userId, isActive) {
        try {
            return await this.updateById(userId, { is_active: isActive });
        } catch (error) {
            console.error('Error setting user active status:', error);
            throw error;
        }
    }

    // Get all users with pagination
    async getAllUsers(page = 1, limit = 20, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            let queryText = `
                SELECT id, username, email, full_name, role, phone, is_active, 
                       last_login, created_at, updated_at
                FROM users
            `;
            const values = [];
            let paramCount = 0;
            const whereClauses = [];

            // Apply filters
            if (filters.role) {
                paramCount++;
                whereClauses.push(`role = $${paramCount}`);
                values.push(filters.role);
            }

            if (filters.is_active !== undefined) {
                paramCount++;
                whereClauses.push(`is_active = $${paramCount}`);
                values.push(filters.is_active);
            }

            if (filters.search) {
                paramCount++;
                whereClauses.push(`(full_name ILIKE $${paramCount} OR username ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
                values.push(`%${filters.search}%`);
            }

            if (whereClauses.length > 0) {
                queryText += ` WHERE ${whereClauses.join(' AND ')}`;
            }

            queryText += ` ORDER BY created_at DESC`;

            // Add pagination
            paramCount++;
            queryText += ` LIMIT $${paramCount}`;
            values.push(limit);

            paramCount++;
            queryText += ` OFFSET $${paramCount}`;
            values.push(offset);

            const result = await query(queryText, values);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM users';
            const countValues = [];
            let countParamCount = 0;

            if (whereClauses.length > 0) {
                // Rebuild where clause for count query
                const countWhereClauses = [];
                
                if (filters.role) {
                    countParamCount++;
                    countWhereClauses.push(`role = $${countParamCount}`);
                    countValues.push(filters.role);
                }

                if (filters.is_active !== undefined) {
                    countParamCount++;
                    countWhereClauses.push(`is_active = $${countParamCount}`);
                    countValues.push(filters.is_active);
                }

                if (filters.search) {
                    countParamCount++;
                    countWhereClauses.push(`(full_name ILIKE $${countParamCount} OR username ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`);
                    countValues.push(`%${filters.search}%`);
                }

                countQuery += ` WHERE ${countWhereClauses.join(' AND ')}`;
            }

            const countResult = await query(countQuery, countValues);
            const total = parseInt(countResult.rows[0].total);

            return {
                users: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    // Check if username exists
    async usernameExists(username, excludeUserId = null) {
        try {
            let queryText = 'SELECT COUNT(*) as count FROM users WHERE username = $1';
            const values = [username];

            if (excludeUserId) {
                queryText += ' AND id != $2';
                values.push(excludeUserId);
            }

            const result = await query(queryText, values);
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error('Error checking username existence:', error);
            throw error;
        }
    }

    // Check if email exists
    async emailExists(email, excludeUserId = null) {
        try {
            let queryText = 'SELECT COUNT(*) as count FROM users WHERE email = $1';
            const values = [email];

            if (excludeUserId) {
                queryText += ' AND id != $2';
                values.push(excludeUserId);
            }

            const result = await query(queryText, values);
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error('Error checking email existence:', error);
            throw error;
        }
    }
}

module.exports = new User();
