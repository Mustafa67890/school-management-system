-- School Management System Seed Data
-- Sample data for development and testing

-- Insert default users
INSERT INTO users (username, email, password_hash, full_name, role, phone) VALUES
('admin', 'admin@school.co.tz', '$2b$10$rQZ8kqKqKqKqKqKqKqKqKOeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'System Administrator', 'admin', '0754123456'),
('teacher', 'teacher@school.co.tz', '$2b$10$rQZ8kqKqKqKqKqKqKqKqKOeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'John Teacher', 'teacher', '0765987654'),
('accountant', 'accountant@school.co.tz', '$2b$10$rQZ8kqKqKqKqKqKqKqKqKOeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Mary Accountant', 'accountant', '0712345678'),
('headteacher', 'headteacher@school.co.tz', '$2b$10$rQZ8kqKqKqKqKqKqKqKqKOeKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Dr. Head Teacher', 'head_teacher', '0723456789');

-- Insert fee structure
INSERT INTO fee_structure (class_form, fee_type, amount, academic_year, term) VALUES
('Form 1', 'School Fees', 300000.00, '2024', 'Term 1'),
('Form 1', 'School Fees', 300000.00, '2024', 'Term 2'),
('Form 1', 'School Fees', 300000.00, '2024', 'Term 3'),
('Form 2', 'School Fees', 300000.00, '2024', 'Term 1'),
('Form 2', 'School Fees', 300000.00, '2024', 'Term 2'),
('Form 2', 'School Fees', 300000.00, '2024', 'Term 3'),
('Form 3', 'School Fees', 350000.00, '2024', 'Term 1'),
('Form 3', 'School Fees', 350000.00, '2024', 'Term 2'),
('Form 3', 'School Fees', 350000.00, '2024', 'Term 3'),
('Form 4', 'School Fees', 350000.00, '2024', 'Term 1'),
('Form 4', 'School Fees', 350000.00, '2024', 'Term 2'),
('Form 4', 'School Fees', 350000.00, '2024', 'Term 3'),
('Form 5', 'School Fees', 500000.00, '2024', 'Term 1'),
('Form 5', 'School Fees', 500000.00, '2024', 'Term 2'),
('Form 5', 'School Fees', 500000.00, '2024', 'Term 3'),
('Form 6', 'School Fees', 500000.00, '2024', 'Term 1'),
('Form 6', 'School Fees', 500000.00, '2024', 'Term 2'),
('Form 6', 'School Fees', 500000.00, '2024', 'Term 3');

-- Insert sample students
INSERT INTO students (student_id, full_name, class_form, gender, date_of_birth, phone, parent_guardian_name, parent_guardian_phone, admission_date) VALUES
('STD001', 'John Mwangi Kamau', 'Form 1', 'Male', '2008-05-15', '0754123001', 'Peter Kamau', '0754123456', '2024-01-15'),
('STD002', 'Mary Kiprotich Chepkemoi', 'Form 2', 'Female', '2007-08-22', '0754123002', 'Grace Kiprotich', '0765987654', '2024-01-15'),
('STD003', 'Peter Mwalimu Juma', 'Form 3', 'Male', '2006-12-10', '0754123003', 'James Mwalimu', '0712345678', '2024-01-15'),
('STD004', 'Grace Mwangi Wanjiku', 'Form 4', 'Female', '2005-03-18', '0754123004', 'Susan Mwangi', '0723456789', '2024-01-15'),
('STD005', 'David Kimani Njoroge', 'Form 5', 'Male', '2004-11-25', '0754123005', 'Paul Kimani', '0734567890', '2024-01-15'),
('STD006', 'Sarah Mwende Mutua', 'Form 6', 'Female', '2003-07-08', '0754123006', 'Jane Mutua', '0745678901', '2024-01-15'),
('STD007', 'Michael Ochieng Otieno', 'Form 1', 'Male', '2008-09-14', '0754123007', 'Joseph Ochieng', '0756789012', '2024-01-15'),
('STD008', 'Elizabeth Nyong''o Akinyi', 'Form 2', 'Female', '2007-04-30', '0754123008', 'Margaret Nyong''o', '0767890123', '2024-01-15'),
('STD009', 'Francis Maina Kariuki', 'Form 3', 'Male', '2006-01-20', '0754123009', 'Samuel Maina', '0778901234', '2024-01-15'),
('STD010', 'Agnes Wanjiru Njeri', 'Form 4', 'Female', '2005-06-12', '0754123010', 'Rose Wanjiru', '0789012345', '2024-01-15');

-- Insert sample student payments
INSERT INTO student_payments (student_id, receipt_number, amount_paid, payment_date, payment_method, fee_type, academic_year, term, recorded_by) VALUES
((SELECT id FROM students WHERE student_id = 'STD001'), 'RC-2024-001', 200000.00, '2024-01-20', 'mpesa', 'School Fees', '2024', 'Term 1', (SELECT id FROM users WHERE username = 'accountant')),
((SELECT id FROM students WHERE student_id = 'STD002'), 'RC-2024-002', 300000.00, '2024-01-22', 'bank', 'School Fees', '2024', 'Term 1', (SELECT id FROM users WHERE username = 'accountant')),
((SELECT id FROM students WHERE student_id = 'STD003'), 'RC-2024-003', 150000.00, '2024-01-25', 'cash', 'School Fees', '2024', 'Term 1', (SELECT id FROM users WHERE username = 'accountant')),
((SELECT id FROM students WHERE student_id = 'STD005'), 'RC-2024-004', 500000.00, '2024-02-01', 'bank', 'School Fees', '2024', 'Term 1', (SELECT id FROM users WHERE username = 'accountant')),
((SELECT id FROM students WHERE student_id = 'STD006'), 'RC-2024-005', 250000.00, '2024-02-05', 'mpesa', 'School Fees', '2024', 'Term 1', (SELECT id FROM users WHERE username = 'accountant'));

-- Insert sample staff
INSERT INTO staff (staff_number, full_name, position, department, subjects, classes, base_salary, phone, email, national_id, bank_name, bank_account, date_of_employment, allowances, deductions) VALUES
('STF001', 'John Kamau Mwangi', 'Mathematics Teacher', 'Teaching', ARRAY['Mathematics', 'Physics'], ARRAY['Form 3A', 'Form 4A'], 800000.00, '0754123456', 'john.kamau@school.co.tz', '19850615-12345-67890-12', 'CRDB Bank', 'ACC123456789', '2020-01-15', '[{"name": "Transport", "amount": 50000}, {"name": "Housing", "amount": 100000}]', '[{"name": "Pension", "amount": 40000}, {"name": "Tax", "amount": 80000}]'),
('STF002', 'Mary Mwalimu Juma', 'Head Teacher', 'Management', ARRAY['English', 'Kiswahili'], ARRAY['Form 1A', 'Form 2B'], 1200000.00, '0765987654', 'mary.mwalimu@school.co.tz', '19800312-98765-43210-98', 'NMB Bank', 'ACC987654321', '2018-08-01', '[{"name": "Transport", "amount": 80000}, {"name": "Housing", "amount": 150000}]', '[{"name": "Pension", "amount": 60000}, {"name": "Tax", "amount": 120000}]'),
('STF003', 'Peter Mwangi Njoroge', 'Science Teacher', 'Teaching', ARRAY['Chemistry', 'Biology'], ARRAY['Form 2A', 'Form 3B'], 750000.00, '0712345678', 'peter.mwangi@school.co.tz', '19900220-11111-22222-33', 'CRDB Bank', 'ACC111222333', '2021-03-10', '[{"name": "Transport", "amount": 45000}, {"name": "Housing", "amount": 80000}]', '[{"name": "Pension", "amount": 37500}, {"name": "Tax", "amount": 75000}]'),
('STF004', 'Grace Wanjiku Kariuki', 'English Teacher', 'Teaching', ARRAY['English', 'Literature'], ARRAY['Form 1B', 'Form 4B'], 720000.00, '0723456789', 'grace.wanjiku@school.co.tz', '19920815-44444-55555-66', 'NMB Bank', 'ACC444555666', '2019-09-01', '[{"name": "Transport", "amount": 40000}, {"name": "Housing", "amount": 75000}]', '[{"name": "Pension", "amount": 36000}, {"name": "Tax", "amount": 72000}]');

-- Insert suppliers
INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, tin_number) VALUES
('Stationery Plus Ltd', 'Ahmed Hassan', '0754111222', 'ahmed@stationeryplus.co.tz', 'Kariakoo, Dar es Salaam', '123-456-789'),
('Science Equipment Co', 'Dr. Sarah Mwangi', '0765222333', 'sarah@scienceequip.co.tz', 'Upanga, Dar es Salaam', '234-567-890'),
('Library Books Suppliers', 'John Mwalimu', '0712333444', 'john@librarybooks.co.tz', 'Sinza, Dar es Salaam', '345-678-901'),
('Maintenance Supplies', 'Grace Kiprotich', '0723444555', 'grace@maintenance.co.tz', 'Mbezi, Dar es Salaam', '456-789-012');

-- Insert budget allocations
INSERT INTO budget_allocations (department, budget_year, allocated_amount, utilized_amount, created_by) VALUES
('Science', '2024', 1500000.00, 850000.00, (SELECT id FROM users WHERE username = 'admin')),
('Library', '2024', 800000.00, 600000.00, (SELECT id FROM users WHERE username = 'admin')),
('Administration', '2024', 1200000.00, 450000.00, (SELECT id FROM users WHERE username = 'admin')),
('Maintenance', '2024', 1000000.00, 1050000.00, (SELECT id FROM users WHERE username = 'admin')),
('Teaching', '2024', 2000000.00, 750000.00, (SELECT id FROM users WHERE username = 'admin'));

-- Insert sample purchase orders
INSERT INTO purchase_orders (po_number, supplier_id, department, total_amount, status, order_date, created_by) VALUES
('PO-2024-001', (SELECT id FROM suppliers WHERE supplier_name = 'Stationery Plus Ltd'), 'Administration', 450000.00, 'received', '2024-01-15', (SELECT id FROM users WHERE username = 'admin')),
('PO-2024-002', (SELECT id FROM suppliers WHERE supplier_name = 'Science Equipment Co'), 'Science', 850000.00, 'received', '2024-01-20', (SELECT id FROM users WHERE username = 'admin')),
('PO-2024-003', (SELECT id FROM suppliers WHERE supplier_name = 'Library Books Suppliers'), 'Library', 600000.00, 'pending', '2024-01-25', (SELECT id FROM users WHERE username = 'admin'));

-- Insert purchase order items
INSERT INTO purchase_order_items (po_id, item_name, description, quantity, unit_price, total_price) VALUES
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-001'), 'Exercise Books', 'A4 Exercise books for students', 200, 1500.00, 300000.00),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-001'), 'Pens', 'Blue ink pens', 100, 500.00, 50000.00),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-001'), 'Chalk', 'White chalk boxes', 50, 2000.00, 100000.00),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-002'), 'Microscopes', 'Laboratory microscopes', 5, 150000.00, 750000.00),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-002'), 'Test Tubes', 'Glass test tubes', 200, 500.00, 100000.00),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-003'), 'Textbooks', 'Form 1-6 textbooks', 150, 3000.00, 450000.00),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-003'), 'Reference Books', 'Library reference books', 50, 3000.00, 150000.00);

-- Insert goods receiving records
INSERT INTO goods_receiving (po_id, receipt_number, received_date, received_by, total_items_expected, total_items_received, status) VALUES
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-001'), 'GRN-2024-001', '2024-01-18', (SELECT id FROM users WHERE username = 'admin'), 350, 350, 'complete'),
((SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-002'), 'GRN-2024-002', '2024-01-23', (SELECT id FROM users WHERE username = 'admin'), 205, 200, 'partial');

-- Insert invoices
INSERT INTO invoices (invoice_number, supplier_id, po_id, invoice_date, due_date, total_amount, status, created_by) VALUES
('INV-2024-001', (SELECT id FROM suppliers WHERE supplier_name = 'Stationery Plus Ltd'), (SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-001'), '2024-01-16', '2024-02-15', 450000.00, 'paid', (SELECT id FROM users WHERE username = 'accountant')),
('INV-2024-002', (SELECT id FROM suppliers WHERE supplier_name = 'Science Equipment Co'), (SELECT id FROM purchase_orders WHERE po_number = 'PO-2024-002'), '2024-01-21', '2024-02-20', 850000.00, 'approved', (SELECT id FROM users WHERE username = 'accountant')),
('INV-2024-003', (SELECT id FROM suppliers WHERE supplier_name = 'Maintenance Supplies'), NULL, '2024-01-18', '2024-02-10', 320000.00, 'pending', (SELECT id FROM users WHERE username = 'accountant'));

-- Insert sample inventory items
INSERT INTO inventory_items (item_code, item_name, category, unit_of_measure, current_stock, minimum_stock, unit_cost, location) VALUES
('ITM001', 'Exercise Books A4', 'Stationery', 'pieces', 500, 100, 1500.00, 'Store Room A'),
('ITM002', 'Blue Pens', 'Stationery', 'pieces', 200, 50, 500.00, 'Store Room A'),
('ITM003', 'White Chalk', 'Stationery', 'boxes', 25, 10, 2000.00, 'Store Room A'),
('ITM004', 'Microscopes', 'Laboratory Equipment', 'pieces', 5, 2, 150000.00, 'Science Lab'),
('ITM005', 'Test Tubes', 'Laboratory Equipment', 'pieces', 200, 50, 500.00, 'Science Lab'),
('ITM006', 'Mathematics Textbooks', 'Books', 'pieces', 100, 20, 3000.00, 'Library'),
('ITM007', 'English Textbooks', 'Books', 'pieces', 80, 20, 3000.00, 'Library');

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('school_name', 'Mwalimu Secondary School', 'string', 'Official school name', true),
('school_address', 'P.O. Box 123, Dar es Salaam, Tanzania', 'string', 'School postal address', true),
('school_phone', '+255 754 123 456', 'string', 'School contact phone', true),
('school_email', 'info@mwalimu.co.tz', 'string', 'School contact email', true),
('current_academic_year', '2024', 'string', 'Current academic year', true),
('current_term', 'Term 1', 'string', 'Current academic term', true),
('default_currency', 'TZS', 'string', 'Default currency code', true),
('session_timeout', '480', 'number', 'Session timeout in minutes', false),
('backup_frequency', 'daily', 'string', 'Database backup frequency', false),
('max_file_upload_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', false);

-- Create a sample payroll run
INSERT INTO payroll_runs (run_name, pay_period_start, pay_period_end, status, created_by) VALUES
('January 2024 Payroll', '2024-01-01', '2024-01-31', 'processed', (SELECT id FROM users WHERE username = 'admin'));

-- Insert payroll entries for the sample run
INSERT INTO payroll_entries (payroll_run_id, staff_id, base_salary, total_allowances, total_deductions, gross_salary, net_salary, payment_status) VALUES
((SELECT id FROM payroll_runs WHERE run_name = 'January 2024 Payroll'), (SELECT id FROM staff WHERE staff_number = 'STF001'), 800000.00, 150000.00, 120000.00, 950000.00, 830000.00, 'paid'),
((SELECT id FROM payroll_runs WHERE run_name = 'January 2024 Payroll'), (SELECT id FROM staff WHERE staff_number = 'STF002'), 1200000.00, 230000.00, 180000.00, 1430000.00, 1250000.00, 'paid'),
((SELECT id FROM payroll_runs WHERE run_name = 'January 2024 Payroll'), (SELECT id FROM staff WHERE staff_number = 'STF003'), 750000.00, 125000.00, 112500.00, 875000.00, 762500.00, 'pending'),
((SELECT id FROM payroll_runs WHERE run_name = 'January 2024 Payroll'), (SELECT id FROM staff WHERE staff_number = 'STF004'), 720000.00, 115000.00, 108000.00, 835000.00, 727000.00, 'pending');