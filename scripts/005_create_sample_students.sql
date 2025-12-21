-- Create sample student records for the default student users
-- This should be run AFTER creating the auth users via the script

-- Note: Replace the user_id values with actual IDs from your auth.users table
-- You can get these by running: SELECT id, email FROM auth.users WHERE email LIKE 'student%';

-- Sample student for Aisha Mohammed (student001@chst.edu.ng)
INSERT INTO students (
  user_id,
  student_id,
  department_id,
  level,
  admission_year,
  status,
  phone,
  address,
  date_of_birth,
  gender,
  state_of_origin,
  lga
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'student001@chst.edu.ng'),
  'CHST/2024/001',
  1, -- Nursing
  100,
  2024,
  'active',
  '08012345678',
  '123 Hospital Road, Hadejia',
  '2005-03-15',
  'female',
  'Jigawa',
  'Hadejia'
);

-- Sample student for Musa Ibrahim (student002@chst.edu.ng)
INSERT INTO students (
  user_id,
  student_id,
  department_id,
  level,
  admission_year,
  status,
  phone,
  address,
  date_of_birth,
  gender,
  state_of_origin,
  lga
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'student002@chst.edu.ng'),
  'CHST/2024/002',
  2, -- Medical Laboratory Science
  100,
  2024,
  'active',
  '08023456789',
  '456 College Avenue, Hadejia',
  '2004-07-22',
  'male',
  'Jigawa',
  'Hadejia'
);

-- Sample student for Zainab Suleiman (student003@chst.edu.ng)
INSERT INTO students (
  user_id,
  student_id,
  department_id,
  level,
  admission_year,
  status,
  phone,
  address,
  date_of_birth,
  gender,
  state_of_origin,
  lga
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'student003@chst.edu.ng'),
  'CHST/2024/003',
  1, -- Nursing
  100,
  2024,
  'active',
  '08034567890',
  '789 Medical Lane, Hadejia',
  '2005-11-08',
  'female',
  'Jigawa',
  'Hadejia'
);

-- Create sample payment records for students
INSERT INTO payments (student_id, amount, payment_type, payment_method, status, reference_number, academic_session)
SELECT 
  id,
  50000.00,
  'tuition',
  'bank_transfer',
  'verified',
  'PAY/' || TO_CHAR(CURRENT_DATE, 'YYYY') || '/' || LPAD(id::text, 6, '0'),
  '2024/2025'
FROM students
WHERE student_id IN ('CHST/2024/001', 'CHST/2024/002', 'CHST/2024/003');

COMMENT ON SCRIPT IS 'Creates sample student records and payment data for default student users';
