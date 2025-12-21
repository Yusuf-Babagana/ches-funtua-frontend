-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'registrar', 'desk_officer', 'hod', 'lecturer', 'student')),
  department_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  level TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  lecturer_id UUID REFERENCES public.users(id),
  credits INTEGER,
  semester TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course_registrations table
CREATE TABLE IF NOT EXISTS public.course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id),
  course_id UUID REFERENCES public.courses(id),
  semester TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id),
  student_id UUID REFERENCES public.students(id),
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_registration_id UUID REFERENCES public.course_registrations(id),
  assessment_type TEXT NOT NULL,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow authenticated users to read their own data)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admin can view all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Allow all authenticated users to read departments and courses
CREATE POLICY "Anyone can view departments" ON public.departments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Students can view their own data
CREATE POLICY "Students can view own data" ON public.students
  FOR SELECT USING (user_id = auth.uid());

-- Create trigger to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample departments
INSERT INTO public.departments (name, code) VALUES
  ('Nursing', 'NUR'),
  ('Medical Laboratory Science', 'MLS'),
  ('Community Health', 'CHE')
ON CONFLICT (code) DO NOTHING;
