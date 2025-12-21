-- Create Users table (extends auth.users with role and profile info)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'registrar', 'desk_officer', 'hod', 'lecturer', 'student')),
  department_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for department_id in users table
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Create Students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  level TEXT NOT NULL CHECK (level IN ('100', '200', '300', '400')),
  admission_year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'graduated')) DEFAULT 'pending',
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('tuition', 'registration', 'exam', 'library', 'other')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'card', 'online')),
  reference_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  level TEXT NOT NULL CHECK (level IN ('100', '200', '300', '400')),
  semester TEXT NOT NULL CHECK (semester IN ('first', 'second')),
  lecturer_id UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Course Registrations table
CREATE TABLE IF NOT EXISTS public.course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, semester, academic_year)
);

-- Create Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id, date)
);

-- Create Grades table
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_registration_id UUID REFERENCES public.course_registrations(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('assignment', 'quiz', 'midterm', 'final', 'project')),
  score DECIMAL(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  max_score DECIMAL(5, 2) NOT NULL DEFAULT 100,
  graded_by UUID REFERENCES public.users(id),
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON public.courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_student ON public.course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_registrations_course ON public.course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_registration ON public.grades(course_registration_id);
