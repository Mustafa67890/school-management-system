const { query, transaction } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    // Create a new record
    async create(data, client = null) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, index) => `$${index + 1}`);

            // Add ID if not provided
            if (!data.id) {
                fields.unshift('id');
                values.unshift(uuidv4());
                placeholders.unshift('$1');
                // Adjust other placeholders
                for (let i = 1; i < placeholders.length; i++) {
                    placeholders[i] = `$${i + 1}`;
                }
            }

            const queryText = `
                INSERT INTO ${this.tableName} (${fields.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            const result = client 
                ? await client.query(queryText, values)
                : await query(queryText, values);

            return result.rows[0];
        } catch (error) {
            console.error(`Error creating ${this.tableName}:`, error);
            throw error;
        }
    }

    // Find record by ID
    async findById(id) {
        try {
            const result = await query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error finding ${this.tableName} by ID:`, error);
            throw error;
        }
    }

    // Find all records with optional conditions
    async findAll(conditions = {}, orderBy = 'created_at DESC', limit = null, offset = null) {
        try {
            let queryText = `SELECT * FROM ${this.tableName}`;
            const values = [];
            let paramCount = 0;

            // Add WHERE conditions
            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions).map(key => {
                    paramCount++;
                    values.push(conditions[key]);
                    return `${key} = $${paramCount}`;
                }).join(' AND ');
                queryText += ` WHERE ${whereClause}`;
            }

            // Add ORDER BY
            if (orderBy) {
                queryText += ` ORDER BY ${orderBy}`;
            }

            // Add LIMIT
            if (limit) {
                paramCount++;
                queryText += ` LIMIT $${paramCount}`;
                values.push(limit);
            }

            // Add OFFSET
            if (offset) {
                paramCount++;
                queryText += ` OFFSET $${paramCount}`;
                values.push(offset);
            }

            const result = await query(queryText, values);
            return result.rows;
        } catch (error) {
            console.error(`Error finding all ${this.tableName}:`, error);
            throw error;
        }
    }

    // Update record by ID
    async updateById(id, data, client = null) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            // Add updated_at if table has this field
            if (!data.updated_at) {
                fields.push('updated_at');
                values.push(new Date());
            }

            const setClause = fields.map((field, index) => 
                `${field} = $${index + 1}`
            ).join(', ');

            values.push(id); // Add ID as last parameter

            const queryText = `
                UPDATE ${this.tableName} 
                SET ${setClause}
                WHERE id = $${values.length}
                RETURNING *
            `;

            const result = client 
                ? await client.query(queryText, values)
                : await query(queryText, values);

            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error updating ${this.tableName}:`, error);
            throw error;
        }
    }

    // Delete record by ID
    async deleteById(id, client = null) {
        try {
            const queryText = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
            const result = client 
                ? await client.query(queryText, [id])
                : await query(queryText, [id]);

            return result.rows[0] || null;
        } catch (error) {
            console.error(`Error deleting ${this.tableName}:`, error);
            throw error;
        }
    }

    // Count records with optional conditions
    async count(conditions = {}) {
        try {
            let queryText = `SELECT COUNT(*) as count FROM ${this.tableName}`;
            const values = [];
            let paramCount = 0;

            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions).map(key => {
                    paramCount++;
                    values.push(conditions[key]);
                    return `${key} = $${paramCount}`;
                }).join(' AND ');
                queryText += ` WHERE ${whereClause}`;
            }

            const result = await query(queryText, values);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error(`Error counting ${this.tableName}:`, error);
            throw error;
        }
    }

    // Check if record exists
    async exists(conditions) {
        try {
            const count = await this.count(conditions);
            return count > 0;
        } catch (error) {
            console.error(`Error checking existence in ${this.tableName}:`, error);
            throw error;
        }
    }

    // Find one record with conditions
    async findOne(conditions = {}, orderBy = 'created_at DESC') {
        try {
            const results = await this.findAll(conditions, orderBy, 1);
            return results[0] || null;
        } catch (error) {
            console.error(`Error finding one ${this.tableName}:`, error);
            throw error;
        }
    }

    // Bulk insert
    async bulkInsert(dataArray, client = null) {
        try {
            if (!dataArray || dataArray.length === 0) {
                return [];
            }

            const results = [];
            
            if (client) {
                // Use transaction if client provided
                for (const data of dataArray) {
                    const result = await this.create(data, client);
                    results.push(result);
                }
            } else {
                // Use transaction wrapper
                await transaction(async (transactionClient) => {
                    for (const data of dataArray) {
                        const result = await this.create(data, transactionClient);
                        results.push(result);
                    }
                });
            }

            return results;
        } catch (error) {
            console.error(`Error bulk inserting ${this.tableName}:`, error);
            throw error;
        }
    }

    // Search with LIKE operator
    async search(searchFields, searchTerm, conditions = {}, orderBy = 'created_at DESC', limit = 50) {
        try {
            let queryText = `SELECT * FROM ${this.tableName}`;
            const values = [];
            let paramCount = 0;
            const whereClauses = [];

            // Add search conditions
            if (searchTerm && searchFields.length > 0) {
                const searchConditions = searchFields.map(field => {
                    paramCount++;
                    values.push(`%${searchTerm}%`);
                    return `${field} ILIKE $${paramCount}`;
                });
                whereClauses.push(`(${searchConditions.join(' OR ')})`);
            }

            // Add other conditions
            if (Object.keys(conditions).length > 0) {
                const additionalConditions = Object.keys(conditions).map(key => {
                    paramCount++;
                    values.push(conditions[key]);
                    return `${key} = $${paramCount}`;
                });
                whereClauses.push(...additionalConditions);
            }

            if (whereClauses.length > 0) {
                queryText += ` WHERE ${whereClauses.join(' AND ')}`;
            }

            if (orderBy) {
                queryText += ` ORDER BY ${orderBy}`;
            }

            if (limit) {
                paramCount++;
                queryText += ` LIMIT $${paramCount}`;
                values.push(limit);
            }

            const result = await query(queryText, values);
            return result.rows;
        } catch (error) {
            console.error(`Error searching ${this.tableName}:`, error);
            throw error;
        }
    }
}

module.exports = BaseModel;
