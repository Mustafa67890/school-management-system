-- SQLite Database Schema for School Management System
-- This is a simplified version for quick setup and testing

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    class TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    staff_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    fee_type TEXT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    receipt_number TEXT,
    status TEXT DEFAULT 'paid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Procurement table
CREATE TABLE IF NOT EXISTS procurement (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    supplier TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    purchase_date DATE,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT OR IGNORE INTO users (id, username, password, email, full_name, role, status) VALUES 
('admin-001', 'admin', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'admin@school.co.tz', 'System Administrator', 'admin', 'active');

-- Insert demo users
INSERT OR IGNORE INTO users (id, username, password, email, full_name, role, status) VALUES 
('teacher-001', 'teacher', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'teacher@school.co.tz', 'John Mwalimu', 'teacher', 'active'),
('accountant-001', 'accountant', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'accountant@school.co.tz', 'Mary Hesabu', 'accountant', 'active'),
('headteacher-001', 'headteacher', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'head@school.co.tz', 'Dr. James Mkuu', 'head_teacher', 'active');

-- Insert demo students
INSERT OR IGNORE INTO students (id, student_id, first_name, last_name, date_of_birth, gender, class, parent_name, parent_phone) VALUES 
('std-001', 'STD20241001', 'Amina', 'Hassan', '2008-03-15', 'Female', 'Form 1A', 'Hassan Mwalimu', '+255754123456'),
('std-002', 'STD20241002', 'John', 'Mwanga', '2007-08-22', 'Male', 'Form 2B', 'Grace Mwanga', '+255765234567'),
('std-003', 'STD20241003', 'Fatuma', 'Said', '2008-11-10', 'Female', 'Form 1B', 'Said Bakari', '+255776345678');

-- Insert demo staff
INSERT OR IGNORE INTO staff (id, staff_number, first_name, last_name, position, department, phone, email, salary) VALUES 
('stf-001', 'STF20241001', 'John', 'Kamau', 'Teacher', 'Mathematics', '+255754111222', 'j.kamau@school.co.tz', 800000.00),
('stf-002', 'STF20241002', 'Mary', 'Mwalimu', 'Head Teacher', 'Administration', '+255754333444', 'm.mwalimu@school.co.tz', 1200000.00);

-- Insert demo fee payments
INSERT OR IGNORE INTO fee_payments (id, student_id, amount, fee_type, payment_date, payment_method, receipt_number) VALUES 
('fee-001', 'std-001', 150000.00, 'School Fees', '2024-09-15', 'M-Pesa', 'RC-2024-001'),
('fee-002', 'std-002', 150000.00, 'School Fees', '2024-09-16', 'Cash', 'RC-2024-002'),
('fee-003', 'std-003', 75000.00, 'School Fees', '2024-09-17', 'Bank', 'RC-2024-003');

-- Insert demo procurement
INSERT OR IGNORE INTO procurement (id, item_name, supplier, quantity, unit_price, total_amount, purchase_date, status) VALUES 
('proc-001', 'Exercise Books', 'Stationery Plus Ltd', 500, 1500.00, 750000.00, '2024-09-10', 'completed'),
('proc-002', 'Desks and Chairs', 'School Furniture Co', 50, 85000.00, 4250000.00, '2024-09-12', 'pending'),
('proc-003', 'Science Equipment', 'Lab Supplies Tanzania', 1, 2500000.00, 2500000.00, '2024-09-14', 'approved');
