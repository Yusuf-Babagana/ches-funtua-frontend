-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Everyone can view departments
CREATE POLICY "Anyone can view departments"
  ON public.departments
  FOR SELECT
  USING (true);

-- Insert sample departments
INSERT INTO public.departments (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Nursing', 'NUR'),
  ('Medical Laboratory Science', 'MLS')
ON CONFLICT (code) DO NOTHING;
