-- School Management System Database Schema
-- Run this script to create all necessary tables

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teacher',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    class VARCHAR(20),
    stream VARCHAR(10),
    parent_guardian_name VARCHAR(100),
    parent_guardian_phone VARCHAR(20),
    parent_guardian_email VARCHAR(100),
    parent_guardian_relationship VARCHAR(20),
    address TEXT,
    medical_conditions TEXT,
    status VARCHAR(20) DEFAULT 'active',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    staff_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    position VARCHAR(50),
    department VARCHAR(50),
    subjects TEXT,
    classes TEXT,
    employment_type VARCHAR(20) DEFAULT 'permanent',
    salary_type VARCHAR(20) DEFAULT 'monthly',
    base_salary DECIMAL(12,2) DEFAULT 0,
    phone VARCHAR(20),
    email VARCHAR(100),
    national_id VARCHAR(30),
    bank_name VARCHAR(50),
    bank_account VARCHAR(30),
    date_of_employment DATE,
    status VARCHAR(20) DEFAULT 'active',
    address TEXT,
    allowances JSON,
    deductions JSON,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee structures table
CREATE TABLE IF NOT EXISTS fee_structures (
    id SERIAL PRIMARY KEY,
    class VARCHAR(20) NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    term VARCHAR(20),
    academic_year VARCHAR(10),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id INTEGER REFERENCES fee_structures(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_date DATE DEFAULT CURRENT_DATE,
    receipt_number VARCHAR(30) UNIQUE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(30) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    department VARCHAR(50),
    description TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll runs table
CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    total_amount DECIMAL(12,2) DEFAULT 0,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll details table
CREATE TABLE IF NOT EXISTS payroll_details (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
    basic_salary DECIMAL(12,2) NOT NULL,
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, full_name, role, status) 
VALUES ('admin', 'admin@school.ac.tz', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insert sample fee structures
INSERT INTO fee_structures (class, fee_type, amount, term, academic_year, description) VALUES
('Form 1', 'tuition', 300000, 'Term 1', '2024', 'Tuition fees for Form 1'),
('Form 2', 'tuition', 320000, 'Term 1', '2024', 'Tuition fees for Form 2'),
('Form 3', 'tuition', 350000, 'Term 1', '2024', 'Tuition fees for Form 3'),
('Form 4', 'tuition', 380000, 'Term 1', '2024', 'Tuition fees for Form 4')
ON CONFLICT DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, category) VALUES
('Stationery Plus Ltd', 'John Mwalimu', '+255 712 345 678', 'info@stationeryplus.co.tz', 'Stationery'),
('Science Equipment Co', 'Mary Kamau', '+255 713 456 789', 'sales@scienceequip.co.tz', 'Equipment'),
('Library Books Suppliers', 'Peter Mwangi', '+255 714 567 890', 'books@library.co.tz', 'Books')
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
('school_name', 'Mwalimu Secondary School', 'Official school name', 'general'),
('school_address', 'P.O. Box 123, Dar es Salaam, Tanzania', 'School physical address', 'general'),
('school_phone', '+255 22 123 4567', 'School contact phone', 'general'),
('school_email', 'info@mwalimu.ac.tz', 'School official email', 'general'),
('currency', 'TZS', 'Default currency', 'financial'),
('academic_year', '2024', 'Current academic year', 'academic')
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;
