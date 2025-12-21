-- RLS Policies for Users table
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for Departments table
CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Super admins and HODs can manage departments"
  ON public.departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'hod')
    )
  );

-- RLS Policies for Students table
CREATE POLICY "Students can view their own data"
  ON public.students FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Staff can view all students"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'registrar', 'desk_officer', 'hod', 'lecturer')
    )
  );

CREATE POLICY "Registrar can manage students"
  ON public.students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'registrar')
    )
  );

-- RLS Policies for Payments table
CREATE POLICY "Students can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Desk officers can view and manage payments"
  ON public.payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'desk_officer')
    )
  );

-- RLS Policies for Courses table
CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "HODs and lecturers can manage courses"
  ON public.courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'hod', 'lecturer')
    )
  );

-- RLS Policies for Course Registrations table
CREATE POLICY "Students can view their own registrations"
  ON public.course_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create registrations"
  ON public.course_registrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Desk officers can manage registrations"
  ON public.course_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'desk_officer')
    )
  );

-- RLS Policies for Attendance table
CREATE POLICY "Students can view their own attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Lecturers can manage attendance"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'lecturer')
    )
  );

-- RLS Policies for Grades table
CREATE POLICY "Students can view their own grades"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_registrations cr
      JOIN public.students s ON s.id = cr.student_id
      WHERE cr.id = course_registration_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Lecturers can manage grades"
  ON public.grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'lecturer')
    )
  );

-- RLS Policies for Audit Logs table
CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "All authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
