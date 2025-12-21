-- Note: These users need to be created in Supabase Auth first
-- This script assumes the auth users already exist and just creates the profile records

-- Insert default departments
INSERT INTO public.departments (id, name, code) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Nursing Science', 'NUR'),
  ('d2222222-2222-2222-2222-222222222222', 'Medical Laboratory Science', 'MLS'),
  ('d3333333-3333-3333-3333-333333333333', 'Community Health', 'CHE'),
  ('d4444444-4444-4444-4444-444444444444', 'Environmental Health', 'ENV')
ON CONFLICT (code) DO NOTHING;

-- Note: To create default users, you need to:
-- 1. Create them in Supabase Auth dashboard or via API
-- 2. Then insert their profile data here

-- Example: If you've created auth users, insert their profiles:
-- INSERT INTO public.users (id, email, full_name, role, department_id) VALUES
--   ('auth-user-id-1', 'admin@college.edu', 'System Administrator', 'super_admin', NULL),
--   ('auth-user-id-2', 'registrar@college.edu', 'John Registrar', 'registrar', NULL),
--   ('auth-user-id-3', 'desk@college.edu', 'Jane Desk', 'desk_officer', NULL),
--   ('auth-user-id-4', 'hod@college.edu', 'Dr. Smith', 'hod', 'd1111111-1111-1111-1111-111111111111'),
--   ('auth-user-id-5', 'lecturer@college.edu', 'Prof. Johnson', 'lecturer', 'd1111111-1111-1111-1111-111111111111');

-- Insert sample courses
INSERT INTO public.courses (code, title, description, credits, department_id, level, semester) VALUES
  ('NUR101', 'Introduction to Nursing', 'Basic nursing principles and practices', 3, 'd1111111-1111-1111-1111-111111111111', '100', 'first'),
  ('NUR102', 'Anatomy and Physiology', 'Study of human body structure and function', 4, 'd1111111-1111-1111-1111-111111111111', '100', 'first'),
  ('MLS101', 'Introduction to Medical Laboratory', 'Basic laboratory techniques', 3, 'd2222222-2222-2222-2222-222222222222', '100', 'first'),
  ('CHE101', 'Community Health Basics', 'Introduction to community health', 3, 'd3333333-3333-3333-3333-333333333333', '100', 'first')
ON CONFLICT (code) DO NOTHING;
