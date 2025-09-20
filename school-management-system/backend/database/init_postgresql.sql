-- PostgreSQL Database Schema for School Management System
-- For Render.com deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teacher',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    class VARCHAR(20),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(50),
    department VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    salary DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    receipt_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Procurement table
CREATE TABLE IF NOT EXISTS procurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(100) NOT NULL,
    supplier VARCHAR(100),
    quantity INTEGER,
    unit_price DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    purchase_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_staff_staff_number ON staff(staff_number);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_procurement_status ON procurement(status);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, email, full_name, role, status) VALUES 
('admin', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'admin@school.co.tz', 'System Administrator', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insert demo users
INSERT INTO users (username, password, email, full_name, role, status) VALUES 
('teacher', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'teacher@school.co.tz', 'John Mwalimu', 'teacher', 'active'),
('accountant', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'accountant@school.co.tz', 'Mary Hesabu', 'accountant', 'active'),
('headteacher', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj1VjPMpH/EO', 'head@school.co.tz', 'Dr. James Mkuu', 'head_teacher', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insert demo students
INSERT INTO students (student_id, first_name, last_name, date_of_birth, gender, class, parent_name, parent_phone) VALUES 
('STD20241001', 'Amina', 'Hassan', '2008-03-15', 'Female', 'Form 1A', 'Hassan Mwalimu', '+255754123456'),
('STD20241002', 'John', 'Mwanga', '2007-08-22', 'Male', 'Form 2B', 'Grace Mwanga', '+255765234567'),
('STD20241003', 'Fatuma', 'Said', '2008-11-10', 'Female', 'Form 1B', 'Said Bakari', '+255776345678')
ON CONFLICT (student_id) DO NOTHING;

-- Insert demo staff
INSERT INTO staff (staff_number, first_name, last_name, position, department, phone, email, salary) VALUES 
('STF20241001', 'John', 'Kamau', 'Teacher', 'Mathematics', '+255754111222', 'j.kamau@school.co.tz', 800000.00),
('STF20241002', 'Mary', 'Mwalimu', 'Head Teacher', 'Administration', '+255754333444', 'm.mwalimu@school.co.tz', 1200000.00)
ON CONFLICT (staff_number) DO NOTHING;

-- Insert demo fee payments (using student IDs from above)
INSERT INTO fee_payments (student_id, amount, fee_type, payment_date, payment_method, receipt_number) 
SELECT s.id, 150000.00, 'School Fees', '2024-09-15', 'M-Pesa', 'RC-2024-001'
FROM students s WHERE s.student_id = 'STD20241001'
ON CONFLICT DO NOTHING;

INSERT INTO fee_payments (student_id, amount, fee_type, payment_date, payment_method, receipt_number) 
SELECT s.id, 150000.00, 'School Fees', '2024-09-16', 'Cash', 'RC-2024-002'
FROM students s WHERE s.student_id = 'STD20241002'
ON CONFLICT DO NOTHING;

INSERT INTO fee_payments (student_id, amount, fee_type, payment_date, payment_method, receipt_number) 
SELECT s.id, 75000.00, 'School Fees', '2024-09-17', 'Bank', 'RC-2024-003'
FROM students s WHERE s.student_id = 'STD20241003'
ON CONFLICT DO NOTHING;

-- Insert demo procurement
INSERT INTO procurement (item_name, supplier, quantity, unit_price, total_amount, purchase_date, status) VALUES 
('Exercise Books', 'Stationery Plus Ltd', 500, 1500.00, 750000.00, '2024-09-10', 'completed'),
('Desks and Chairs', 'School Furniture Co', 50, 85000.00, 4250000.00, '2024-09-12', 'pending'),
('Science Equipment', 'Lab Supplies Tanzania', 1, 2500000.00, 2500000.00, '2024-09-14', 'approved')
ON CONFLICT DO NOTHING;
