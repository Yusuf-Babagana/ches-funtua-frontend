const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://funtua.pythonanywhere.com/api'

// Generic fetch with auth
const fetchWithToken = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')

  // Construct full URL for external API calls
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  console.log(`🚀 API Request: ${options.method || 'GET'} ${fullUrl}`)
  console.log(`🔑 Auth Token: ${token ? 'Present' : 'Missing'}`)

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(fullUrl, config)

    console.log(`📥 API Response: ${response.status} ${response.statusText}`)

    // Log response headers for debugging
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      // Try to get error details from response
      let errorData
      let responseText = ''
      try {
        responseText = await response.text()
        console.log(`❌ Response Text:`, responseText)
        errorData = JSON.parse(responseText)
      } catch {
        errorData = {
          detail: `HTTP error! status: ${response.status} ${response.statusText}`,
          status: response.status,
          response_text: responseText
        }
      }

      console.error(`❌ API Error on ${fullUrl} [${response.status} ${response.statusText}]:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })

      // Handle specific status codes
      if (response.status === 401) {
        console.log('🛡️  Unauthorized - clearing token')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } else if (response.status === 404) {
        console.log(`🔍 Endpoint not found: ${fullUrl}`)
        // Return specific error for 404
        return {
          error: {
            detail: `Endpoint not found: ${endpoint}`,
            status: 404,
            endpoint: endpoint
          },
          status: 404
        }
      }

      return { error: errorData, status: response.status }
    }


    if (response.status === 204) {
      console.log(`✅ API Success (No Content): 204`)
      return { status: 204, success: true }
    }

    const data = await response.json()
    console.log(`✅ API Success:`, data)
    return data

  } catch (error) {
    console.error(`💥 Network error on ${fullUrl}:`, error)
    return {
      error: {
        detail: 'Network error - please check your connection and CORS settings',
        networkError: true,
        endpoint: endpoint
      }
    }
  }
}



// API client methods
export const apiClient = {
  get: (endpoint: string) => fetchWithToken(endpoint, { method: 'GET' }),

  post: (endpoint: string, data: any) =>
    fetchWithToken(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  put: (endpoint: string, data: any) =>
    fetchWithToken(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  patch: (endpoint: string, data: any) =>
    fetchWithToken(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  delete: (endpoint: string) =>
    fetchWithToken(endpoint, { method: 'DELETE' }),
};

// Auth-specific API calls
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login/', { email, password }),

  registerStudent: (data: any) =>
    apiClient.post('/auth/register/student/', data),

  registerLecturer: (data: any) =>
    apiClient.post('/auth/register/lecturer/', data),

  registerStaff: (data: any) =>
    apiClient.post('/auth/register/staff/', data),

  registerHOD: (data: any, hodData: { department_id: number; matric_number: string; level: string; admission_date: string; staff_id?: undefined; designation?: undefined; is_hod?: undefined; position?: undefined; user_data: { email: string; username: string; first_name: string; last_name: string; phone: string; role: string; password: string; password_confirm: string } } | { department_id: number; staff_id: string; designation: string; matric_number?: undefined; level?: undefined; admission_date?: undefined; is_hod?: undefined; position?: undefined; user_data: { email: string; username: string; first_name: string; last_name: string; phone: string; role: string; password: string; password_confirm: string } } | { department_id: number; staff_id: string; designation: string; is_hod: boolean; matric_number?: undefined; level?: undefined; admission_date?: undefined; position?: undefined; user_data: { email: string; username: string; first_name: string; last_name: string; phone: string; role: string; password: string; password_confirm: string } } | { department_id: number; staff_id: string; position: string; matric_number?: undefined; level?: undefined; admission_date?: undefined; designation?: undefined; is_hod?: undefined; user_data: { email: string; username: string; first_name: string; last_name: string; phone: string; role: string; password: string; password_confirm: string } }) =>
    apiClient.post('/auth/register/hod/', data),

  getCurrentUser: () => apiClient.get('/auth/me/'),

  refreshToken: (refresh: string) =>
    apiClient.post('/auth/token/refresh/', { refresh }),
};

// User management API calls - UPDATED URLs to use /auth/users/
export const userAPI = {
  // Get all users with pagination and filters
  getUsers: (params?: {
    role?: string
    is_active?: string
    search?: string
    page?: number
    page_size?: number
  }) => {
    const queryParams = new URLSearchParams()
    if (params?.role) queryParams.append('role', params.role)
    if (params?.is_active) queryParams.append('is_active', params.is_active)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) {
      queryParams.append('page_size', params.page_size.toString())
    } else {
      queryParams.append('page_size', '100')
    }

    const queryString = queryParams.toString()
    const url = `/auth/users/${queryString ? `?${queryString}` : ''}`
    console.log(`🎯 UserAPI.getUsers: ${url}`)
    return apiClient.get(url)
  },





  // Get user by ID
  getUser: (id: number) => apiClient.get(`/auth/users/${id}/`),

  // Create user
  createUser: (data: any) => apiClient.post('/auth/users/', data),

  // Update user
  updateUser: (id: number, data: any) => apiClient.put(`/auth/users/${id}/`, data),

  // Partial update user
  patchUser: (id: number, data: any) => apiClient.patch(`/auth/users/${id}/`, data),

  // Delete user
  deleteUser: (id: number) => apiClient.delete(`/auth/users/${id}/`),

  // User actions - UPDATED URLs
  activateUser: (id: number) => apiClient.post(`/auth/users/${id}/activate/`, {}),
  deactivateUser: (id: number) => apiClient.post(`/auth/users/${id}/deactivate/`, {}),
  resetPassword: (id: number, data: { new_password: string; confirm_password: string }) =>
    apiClient.post(`/auth/users/${id}/reset_password/`, data),

  // Bulk actions - UPDATED URL
  bulkActions: (userIds: number[], action: string) =>
    apiClient.post('/auth/users/bulk_actions/', { user_ids: userIds, action }),

  // Statistics - UPDATED URL
  getStats: () => {
    console.log('🎯 UserAPI.getStats: /auth/users/stats/')
    return apiClient.get('/auth/users/stats/')
  },

  // Super Admin Statistics - NEW
  getSuperAdminStats: () => {
    console.log('🎯 UserAPI.getSuperAdminStats: /auth/users/super_admin_stats/')
    return apiClient.get('/auth/users/super_admin_stats/')
  },

  // Filtered lists - UPDATED URLs
  getStudents: () => apiClient.get('/auth/users/students/'),
  getLecturers: () => apiClient.get('/auth/users/lecturers/'),
  getStaff: () => apiClient.get('/auth/users/staff/'),

  // Assign department to lecturer
  assignDepartment: (lecturerId: number, departmentId: number) =>
    apiClient.post('/admin/management/assign_department_to_lecturer/', { lecturer_id: lecturerId, department_id: departmentId }),
};

// Super Admin specific API calls - NEW
export const superAdminAPI = {
  // Get comprehensive super admin statistics
  getSuperAdminStats: () => {
    console.log('🎯 SuperAdminAPI.getSuperAdminStats: /auth/users/super_admin_stats/')
    return apiClient.get('/auth/users/super_admin_stats/')
  },

  // Get academic overview
  getAcademicOverview: () => {
    console.log('🎯 SuperAdminAPI.getAcademicOverview: /academics/admin/management/academic_overview/')
    return apiClient.get('/academics/admin/management/academic_overview/')
  },

  // Get system health
  getSystemHealth: () => {
    console.log('🎯 SuperAdminAPI.getSystemHealth: /academics/admin/system-health/overview/')
    return apiClient.get('/academics/admin/system-health/overview/')
  },

  // Get academic dashboard stats
  getAcademicDashboardStats: () => {
    console.log('🎯 SuperAdminAPI.getAcademicDashboardStats: /academics/admin/management/dashboard_stats/')
    return apiClient.get('/academics/admin/management/dashboard_stats/')
  },

  // Department management
  assignHOD: (departmentId: number, lecturerId: number) =>
    apiClient.post(`/academics/admin/departments/${departmentId}/assign_hod/`, { lecturer_id: lecturerId }),

  removeHOD: (departmentId: number) =>
    apiClient.post(`/academics/admin/departments/${departmentId}/remove_hod/`, {}),

  getAvailableHODs: () =>
    apiClient.get('/academics/admin/departments/available_hods/'),

  // Course management
  assignLecturer: (courseId: number, lecturerId: number) =>
    apiClient.post(`/academics/admin/courses/${courseId}/assign_lecturer/`, { lecturer_id: lecturerId }),

  removeLecturer: (courseId: number) =>
    apiClient.post(`/academics/admin/courses/${courseId}/remove_lecturer/`, {}),

  getUnassignedCourses: () =>
    apiClient.get('/academics/admin/courses/unassigned_courses/'),

  getDepartmentLecturers: (departmentId: number) =>
    apiClient.get(`/academics/admin/courses/department_lecturers/?department_id=${departmentId}`),

  // Bulk assignments
  bulkAssignLecturers: (assignments: Array<{ course_id: number; lecturer_id: number }>) =>
    apiClient.post('/academics/admin/management/bulk_assign_lecturers/', { assignments }),
};

// Academics API calls - REORGANIZED AND UPDATED
export const academicsAPI = {
  // ========================
  // DEPARTMENT ENDPOINTS
  // ========================

  getDepartment: (id: number) => apiClient.get(`/academics/departments/${id}/`),
  createDepartment: (data: any) => apiClient.post('/academics/departments/', data),
  updateDepartment: (id: number, data: any) => apiClient.put(`/academics/departments/${id}/`, data),
  deleteDepartment: (id: number) => apiClient.delete(`/academics/departments/${id}/`),

  // HOD Specific
  getHODDashboard: () => apiClient.get('/academics/departments/my_department/'),

  getAcademicHistory: async () => {
    return await fetchWithToken('/academics/student/dashboard/academic_history/')
  },

  // ✅ Add this new method
  getStudentHistory: async () => {
    const response = await apiClient.get('/academics/student/dashboard/academic_history/');
    return response;
  },

  startNewSession: async (data: any) => {
    return await fetchWithToken('/academics/admin/management/start_new_session/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  promoteStudents: async (data: any) => {
    return await fetchWithToken('/academics/admin/management/promote_students/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // ========================
  // COURSE ENDPOINTS
  // ========================


  // Lecturer specific
  getLecturerCourses: (lecturerId: string) =>
    apiClient.get(`/academics/courses/?lecturer=${lecturerId}`),

  getCourseStudents: (courseId: number) =>
    apiClient.get(`/academics/courses/${courseId}/students/`),





  // ========================
  // GRADE ENDPOINTS
  // ========================
  submitGrade: (data: {
    student: number,
    course: number,
    score: number,
    semester: string,
    session: string,
    enrollment: number
  }) => apiClient.post('/academics/grades/', data),

  updateGrade: (id: number, data: any) =>
    apiClient.patch(`/academics/grades/${id}/`, data),

  getStudentGrades: () =>
    apiClient.get('/academics/grades/student_grades/'),


  // Courses CRUD operations
  getCourses: (params?: {
    department?: number;
    level?: string;
    semester?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department.toString());
    if (params?.level) queryParams.append('level', params.level);
    if (params?.semester) queryParams.append('semester', params.semester);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const url = `/academics/courses/${queryString ? `?${queryString}` : ''}`;
    console.log(`🎯 academicsAPI.getCourses: ${url}`);
    return apiClient.get(url);
  },

  getCourse: (id: number) => {
    console.log(`🎯 academicsAPI.getCourse: /academics/courses/${id}/`);
    return apiClient.get(`/academics/courses/${id}/`);
  },

  createCourse: (data: any) => {
    console.log(`🎯 academicsAPI.createCourse: /academics/courses/`, data);
    return apiClient.post('/academics/courses/', data);
  },

  updateCourse: (id: number, data: any) => {
    console.log(`🎯 academicsAPI.updateCourse: /academics/courses/${id}/`, data);
    return apiClient.put(`/academics/courses/${id}/`, data);
  },

  patchCourse: (id: number, data: any) => {
    console.log(`🎯 academicsAPI.patchCourse: /academics/courses/${id}/`, data);
    return apiClient.patch(`/academics/courses/${id}/`, data);
  },

  deleteCourse: (id: number) => {
    console.log(`🎯 academicsAPI.deleteCourse: /academics/courses/${id}/`);
    return apiClient.delete(`/academics/courses/${id}/`);
  },

  // In academicsAPI or userAPI:
  getAllLecturers: () => apiClient.get('/auth/lecturers/'),

  // With filters
  getLecturers: (params?: {
    department?: number;
    designation?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department.toString());
    if (params?.designation) queryParams.append('designation', params.designation);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const url = `/auth/lecturers/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  // Get departments
  getDepartments: () => {
    console.log('🎯 academicsAPI.getDepartments: /academics/departments/');
    return apiClient.get('/academics/departments/');
  },

  // ========================
  // SEMESTER ENDPOINTS
  // ========================
  getCurrentSemester: () => apiClient.get('/academics/registrar/academic-sessions/current_academic_year/'),

  // ========================
  // STUDENT DASHBOARD ENDPOINTS (OLD - KEEP FOR BACKWARD COMPATIBILITY)
  // ========================
  getStudentRegistrationStatusOld: () =>
    apiClient.get('/academics/student/dashboard/registration_status/'),

  getStudentRegistrationsOld: () =>
    apiClient.get('/academics/student/dashboard/current_schedule/'),

  getAvailableCoursesOld: () =>
    apiClient.get('/academics/student/dashboard/available_courses/'),

  // ========================
  // ✅ UPDATED REGISTRATION ENDPOINTS WITH APPROVAL WORKFLOW
  // ========================

  // Get registration status (checks payment + approval status)
  getRegistrationStatus: () =>
    apiClient.get('/academics/student/dashboard/registration_status/'),

  // Get student's registrations with approval status
  getStudentRegistrations: () =>
    apiClient.get('/academics/registration-approvals/student_registrations/'),

  // Get pending registrations for approval (for lecturers/exam officers)
  getPendingApprovals: () =>
    apiClient.get('/academics/registration-approvals/pending_approvals/'),

  // Register courses (now includes payment check) - BULK REGISTRATION
  registerCourses: (courseOfferingIds: number[]) =>
    apiClient.post('/academics/registrations/register_courses/', {
      course_offering_ids: courseOfferingIds,
    }),

  // Single course registration (compatibility)
  registerCourse: (courseOfferingId: number) =>
    apiClient.post('/academics/registrations/register_courses/', {
      course_offering_ids: [courseOfferingId],
    }),

  // Drop course
  dropCourse: (registrationId: number) =>
    apiClient.post(`/academics/registrations/${registrationId}/drop_course/`, {}),

  // ========================
  // ✅ APPROVAL WORKFLOW ENDPOINTS
  // ========================

  // Lecturer approve/reject registration
  approveRegistrationLecturer: (registrationId: number, action: 'approve' | 'reject', reason?: string) =>
    apiClient.post(`/academics/registration-approvals/${registrationId}/lecturer_approval/`, {
      action,
      reason: reason || ''
    }),

  // Exam officer approve/reject registration
  approveRegistrationExamOfficer: (registrationId: number, action: 'approve' | 'reject', reason?: string) =>
    apiClient.post(`/academics/registration-approvals/${registrationId}/exam_officer_approval/`, {
      action,
      reason: reason || ''
    }),

  // Verify payment (for bursar/desk officer)
  verifyPayment: (registrationId: number) =>
    apiClient.post(`/academics/registration-approvals/${registrationId}/verify_payment/`, {}),

  // Get registration statistics
  getRegistrationStats: () =>
    apiClient.get('/academics/registration-approvals/registration_stats/'),

  // ========================
  // COURSE OFFERING ENDPOINTS
  // ========================
  getAvailableCourses: () =>
    apiClient.get('/academics/course-offerings/available_courses/'),

  getCourseOfferings: () =>
    apiClient.get('/academics/course-offerings/'),

  // ========================
  // ✅ PAYMENT/FINANCE INTEGRATION
  // ========================

  // Check if student has paid fees (via finance API)
  checkFeePaymentStatus: () =>
    apiClient.get('/finance/student/current-invoice/'),

  // ========================
  // OTHER ACADEMIC ENDPOINTS
  // ========================
  getStudentAttendance: () =>
    apiClient.get('/academics/attendance/'),

  getStudentTranscript: () =>
    apiClient.get('/academics/students/transcript/'),

  // For backward compatibility
  getStudentSchedule: () =>
    apiClient.get('/academics/registrations/current_schedule/'),
  getExamCard: () => {
    console.log('🎯 academicsAPI.getExamCard: /academics/student/dashboard/exam_card/');
    return apiClient.get('/academics/student/dashboard/exam_card/');
  },
};



export const financeAPI = {
  // ========================
  // STUDENT FINANCE
  // ========================

  getCurrentInvoice: async () => {
    return await fetchWithToken('/finance/student/current-invoice/')
  },

  getCurrentSemesterInvoice: async () => {
    return await fetchWithToken('/finance/student/current-invoice/')
  },

  getStudentFeeSummary: () =>
    apiClient.get('/finance/student/fee-summary/'),

  getStudentInvoices: () =>
    apiClient.get('/finance/student/invoices/'),

  getStudentPayments: () =>
    apiClient.get('/finance/student/payments/'),

  // ========================
  // STUDENT INVOICE SUMMARY (LOCAL CALCULATION)
  // ========================
  getStudentInvoicesSummary: () => {
    return apiClient.get('/finance/student/invoices/')
      .then((response: any[]) => {
        if (!Array.isArray(response)) return response;

        const totalAmount = response.reduce(
          (sum, inv) => sum + (Number(inv.amount) || 0), 0
        );

        const totalPaid = response.reduce(
          (sum, inv) => sum + (Number(inv.amount_paid) || 0), 0
        );

        const now = new Date();
        const year = now.getFullYear();
        const session = `${year}/${year + 1}`;
        const semester = now.getMonth() < 6 ? 'first' : 'second';

        const hasPaidCurrentFees = response.some(inv =>
          inv.status === 'paid' &&
          inv.session === session &&
          inv.semester === semester
        );

        return {
          total_amount: totalAmount,
          total_paid: totalPaid,
          total_outstanding: totalAmount - totalPaid,
          has_paid_current_fees: hasPaidCurrentFees,
          invoices: response
        };
      });
  },

  // ========================
  // PAYSTACK
  // ========================
  initializePayment: (data: {
    invoice_id: number;
    amount: number;
    email: string;
    callback_url: string;
  }) =>
    apiClient.post('/finance/paystack/initialize/', data),

  verifyPayment: (data: any) =>
    apiClient.post('/finance/paystack/verify/', data),

  // ========================
  // BURSAR
  // ========================
  getBursarDashboard: async () => {
    return await fetchWithToken('/finance/bursar/dashboard/')
  },

  generateBulkInvoices: async (data: any) => {
    return await fetchWithToken(
      '/finance/bursar/invoice-management/generate_bulk/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  markInvoicePaid: async (invoiceId: number) => {
    return await fetchWithToken(
      `/finance/bursar/invoice-management/${invoiceId}/mark_paid/`,
      { method: 'POST' }
    );
  },

  // ========================
  // ADMIN / MANAGEMENT
  // ========================
  getInvoiceSummary: () =>
    apiClient.get('/finance/invoices/summary/'),

  createInvoice: (data: any) =>
    apiClient.post('/finance/invoices/', data),

  getPaymentSummary: () =>
    apiClient.get('/finance/payments/summary/'),

  verifyPaymentById: (id: number) =>
    apiClient.post(`/finance/payments/${id}/verify/`, {}),

  getInvoices: (params?: {
    student?: number;
    status?: string;
    session?: string;
    semester?: string;
  }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiClient.get(`/finance/invoices/${q ? `?${q}` : ''}`);
  },

  getPayments: (params?: {
    student?: number;
    status?: string;
    payment_method?: string;
    invoice?: number;
  }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiClient.get(`/finance/payments/${q ? `?${q}` : ''}`);
  },

  // For bursar-wide invoice listing
  getAllInvoices: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return apiClient.get(`/finance/invoices/${q ? `?${q}` : ''}`);
  },
};


// HOD API calls - UPDATED
export const hodAPI = {
  // HOD Dashboard
  getHODDashboard: async () => {
    // ✅ Matches the path in urls.py
    return await fetchWithToken('/academics/hod/dashboard/department_overview/')
  },

  // Department students
  getDepartmentStudents: (params?: {
    level?: string;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const url = `/academics/hod/dashboard/students/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },





  getDashboardOverview: async () => {
    // Matches: /api/academics/hod/dashboard/department_overview/
    return await fetchWithToken('/academics/hod/dashboard/department_overview/')
  },

  // Department lecturers
  getDepartmentLecturers: (params?: {
    designation?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.designation) queryParams.append('designation', params.designation);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const url = `/academics/hod/dashboard/lecturers/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  // Department courses
  getDepartmentCourses: (params?: {
    level?: string;
    semester?: string;
    has_lecturer?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.semester) queryParams.append('semester', params.semester);
    if (params?.has_lecturer) queryParams.append('has_lecturer', params.has_lecturer);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const url = `/academics/hod/dashboard/courses/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  // Course assignment
  assignCourseLecturer: (courseId: number, lecturerId: number) =>
    apiClient.post(`/academics/hod/dashboard/${courseId}/assign_course_lecturer/`, {
      lecturer_id: lecturerId
    }),

  removeCourseLecturer: (courseId: number) =>
    apiClient.post(`/academics/hod/dashboard/${courseId}/remove_course_lecturer/`, {}),

  // Available lecturers for assignment
  getAvailableLecturers: () =>
    apiClient.get('/academics/hod/dashboard/available_lecturers/'),

  // Student statistics
  getStudentStatistics: () =>
    apiClient.get('/academics/hod/dashboard/student_statistics/'),

  // Bulk assign courses
  bulkAssignCourses: (assignments: Array<{ course_id: number; lecturer_id: number }>) =>
    apiClient.post('/academics/hod/dashboard/bulk_assign_courses/', { assignments }),

  // My department
  getMyDepartment: () =>
    apiClient.get('/academics/departments/my_department/'),
};

// ========================
// ✅ NEW APPROVAL WORKFLOW API (For Lecturers, Exam Officers, Finance Staff)
// ========================
export const approvalAPI = {
  // For Lecturers
  getLecturerPendingApprovals: () =>
    apiClient.get('/academics/registration-approvals/pending_approvals/'),


  approveRejectRegistration: (registrationId: number, data: {
    action: 'approve' | 'reject';
    reason?: string;
  }) => apiClient.post(`/academics/registration-approvals/${registrationId}/lecturer_approval/`, data),


  getExamOfficerPendingApprovals: () =>
    apiClient.get('/academics/registration-approvals/pending_approvals/'),

  approveRejectRegistrationExamOfficer: (registrationId: number, data: {
    action: 'approve' | 'reject';
    reason?: string;
  }) => apiClient.post(`/academics/registration-approvals/${registrationId}/exam_officer_approval/`, data),

  // For Finance Staff (Bursar/Desk Officer)
  getPendingPaymentVerifications: () =>
    apiClient.get('/academics/registration-approvals/pending_approvals/'),

  verifyRegistrationPayment: (registrationId: number) =>
    apiClient.post(`/academics/registration-approvals/${registrationId}/verify_payment/`, {}),

  // Statistics for all roles
  getApprovalStats: () =>
    apiClient.get('/academics/registration-approvals/registration_stats/'),
};

// ========================
// ✅ COURSE REGISTRATION API (For Students)
// ========================
export const registrationAPI = {
  // Check registration eligibility
  getRegistrationEligibility: () =>
    apiClient.get('/academics/student/dashboard/registration_status/'),



  // 4. Get Current Schedule (THIS WAS MISSING)
  getCurrentSchedule: async () => {
    // Maps to StudentDashboardViewSet.current_schedule
    const response = await apiClient.get('/academics/student/dashboard/current_schedule/');
    return response;
  },




  // Get available courses for registration
  getAvailableCoursesForRegistration: () =>
    apiClient.get('/academics/student/dashboard/available_courses/'),

  // Bulk register courses
  registerCourses: (courseOfferingIds: number[]) =>
    apiClient.post('/academics/registrations/register_courses/', {
      course_offering_ids: courseOfferingIds,
    }),

  // Get current registrations
  getCurrentRegistrations: () =>
    apiClient.get('/academics/student/dashboard/current_schedule/'),

  // Drop a course
  dropCourse: (registrationId: number) =>
    apiClient.post(`/academics/registrations/${registrationId}/drop_course/`, {}),

  // Get registration schedule
  getRegistrationSchedule: () =>
    apiClient.get('/academics/student/dashboard/current_schedule/'),

  getRegistrationStatus: async () => {
    // This calls the endpoint: /api/academics/registration-status/
    return fetchWithToken('/academics/registration-status/')
  },
};

// ========================
// ✅ PAYMENT API (For Students)
// ========================
export const paymentAPI = {
  // Get current invoice
  getCurrentInvoice: () => apiClient.get('/finance/student/current-invoice/'),

  // Get all invoices
  getInvoices: () => apiClient.get('/finance/student/invoices/'),

  // Get payment history
  getPaymentHistory: () => apiClient.get('/finance/student/payments/'),

  // Initialize Paystack payment
  initializePayment: (data: { invoice_id: number; amount: number; email: string; callback_url: string }) =>
    apiClient.post('/finance/paystack/initialize/', data),

  // Get fee summary
  getFeeSummary: () => apiClient.get('/finance/student/fee-summary/'),
};

// Add to your api.ts file, after the other API exports:

// ========================
// ✅ LECTURER API
// ========================
export const lecturerAPI = {

  // Dashboard
  getDashboard: () => apiClient.get('/academics/lecturer/dashboard/overview/'),
  getAnnouncements: () => apiClient.get('/academics/lecturer/announcements/'),



  // Courses
  getCourses: () => apiClient.get('/academics/lecturer/courses/'),

  // This is the specific endpoint to get students for a course
  getCourseStudents: (courseId: number) =>
    apiClient.get(`/academics/lecturer/courses/${courseId}/students/`),
  getCurrentSemesterCourses: () =>
    apiClient.get('/academics/lecturer/courses/current_semester_courses/'),

  // Grades
  getCourseGrades: (courseId: number) =>
    apiClient.get(`/academics/lecturer/grades/course_grades/?course_id=${courseId}`),

  // ✅ UPDATED: Support CA and Exam scores
  bulkEnterGrades: (data: {
    course_id: number;
    session?: string;
    semester?: string;
    is_published?: boolean;
    grades: Array<{
      student_id: number;
      ca_score?: number;    // Changed from just 'score'
      exam_score?: number;  // Added exam_score
      score?: number;       // Keep for backward compatibility (Total)
      remarks?: string;
      is_published?: boolean;
    }>
  }) => apiClient.post('/academics/lecturer/grades/bulk_enter_grades/', data),


  // Attendance
  getCourseAttendanceSummary: (courseId: number) =>
    apiClient.get(`/academics/lecturer/attendance/course_attendance_summary/?course_id=${courseId}`),
  bulkMarkAttendance: (data: {
    course_id: number;
    date: string;
    attendance: Array<{ student_id: number; status: string; remarks?: string }>
  }) => apiClient.post('/academics/lecturer/attendance/bulk_mark_attendance/', data),

  // Approvals
  getPendingApprovals: () => apiClient.get('/academics/registration-approvals/pending_approvals/'),
  approveRegistration: (registrationId: number, data: {
    action: 'approve' | 'reject';
    reason?: string;
  }) => apiClient.post(`/academics/lecturer/approvals/${registrationId}/approve_registration/`, data),

  // Profile
  getProfile: () => apiClient.get('/academics/lecturer/profile/'),
};


// Add to your api.ts file, after the lecturerAPI:






// Admissions API calls
export const admissionsAPI = {
  // Add your existing admissions endpoints here...
  // Example:
  // getApplications: () => apiClient.get('/admissions/applications/'),
  // submitApplication: (data: any) => apiClient.post('/admissions/applications/', data),
};



// Add to your api.ts file:

// ========================
// ✅ EXAM OFFICER API
// ========================
export const examOfficerAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/academics/exam-officer/dashboard/overview/'),

  // Registration Approvals
  getPendingApprovals: (params?: {
    department_id?: number;
    course_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
    if (params?.course_id) queryParams.append('course_id', params.course_id.toString());

    const queryString = queryParams.toString();
    const url = `/academics/exam-officer/registrations/pending_approvals/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  approveRegistration: (registrationId: number, data: {
    action: 'approve' | 'reject';
    reason?: string;
  }) => apiClient.post(`/academics/exam-officer/registrations/${registrationId}/approve_registration/`, data),

  bulkApproveRegistrations: (data: {
    registration_ids: number[];
    action: 'approve' | 'reject';
    reason?: string;
  }) => apiClient.post('/academics/exam-officer/registrations/bulk_approve_registrations/', data),

  // Result Compilation
  getCoursesPendingResults: () =>
    apiClient.get('/academics/exam-officer/results/courses_pending_results/'),

  getCourseResultsDetail: (courseId: number) =>
    apiClient.get(`/academics/exam-officer/results/${courseId}/course_results_detail/`),

  verifyCourseResults: (courseId: number, forceApprove?: boolean) =>
    apiClient.post(`/academics/exam-officer/results/${courseId}/verify_course_results/`, {
      force_approve: forceApprove || false
    }),

  generateMasterSheet: (courseId: number) =>
    apiClient.get(`/academics/exam-officer/results/${courseId}/generate_master_sheet/`),

  // Exam List
  getEligibleStudents: () => apiClient.get('/academics/exam-officer/exam-list/eligible_students/'),
  generateExamList: (departmentId?: number) => {
    const queryParams = new URLSearchParams();
    if (departmentId) queryParams.append('department_id', departmentId.toString());
    const queryString = queryParams.toString();
    const url = `/academics/exam-officer/exam-list/generate_exam_list/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },
  downloadExamList: (departmentId?: number) => {
    const queryParams = new URLSearchParams();
    if (departmentId) queryParams.append('department_id', departmentId.toString());
    const queryString = queryParams.toString();
    const url = `/academics/exam-officer/exam-list/download_exam_list/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  // Exam Timetable
  getCurrentTimetable: () => apiClient.get('/academics/exam-officer/timetable/current_timetable/'),
  generateTimetable: (data: {
    exam_start_date: string;
    exam_end_date: string;
    exams_per_day?: number;
  }) => apiClient.post('/academics/exam-officer/timetable/generate_timetable/', data),
  publishTimetable: (timetable: any[]) =>
    apiClient.post('/academics/exam-officer/timetable/publish_timetable/', { timetable }),

  // Profile
  getProfile: () => apiClient.get('/academics/exam-officer/profile/'),
};



// Add to your api.ts file:

// Add to your api.ts file:

// ========================
// ✅ REGISTRAR API
// ========================
export const registrarAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/academics/registrar/dashboard/overview/'),

  // Matric Number Assignment
  getPendingMatricAssignments: () =>
    apiClient.get('/academics/registrar/matric-assignment/pending_assignments/'),

  assignMatricNumbers: (assignments: Array<{
    application_id: number;
    matric_number: string;
  }>) => apiClient.post('/academics/registrar/matric-assignment/assign_matric_numbers/', { assignments }),

  getMatricPatterns: () =>
    apiClient.get('/academics/registrar/matric-assignment/matric_number_patterns/'),

  // Academic Session Management
  getCurrentAcademicYear: () =>
    apiClient.get('/academics/registrar/academic-sessions/current_academic_year/'),

  createAcademicYear: (data: {
    session: string;
    first_semester_start: string;
    first_semester_end: string;
  }) => apiClient.post('/academics/registrar/academic-sessions/create_academic_year/', data),

  activateSemester: (semesterId: number) =>
    apiClient.post(`/academics/registrar/academic-sessions/${semesterId}/activate_semester/`, {}),

  toggleRegistration: (semesterId: number) =>
    apiClient.post(`/academics/registrar/academic-sessions/${semesterId}/toggle_registration/`, {}),

  getAcademicCalendar: () =>
    apiClient.get('/academics/registrar/academic-sessions/academic_calendar/'),

  // Final Result Approval
  getPendingResultApprovals: () =>
    apiClient.get('/academics/registrar/final-approvals/pending_approvals/'),

  getCourseResultDetails: (courseId: number) =>
    apiClient.get(`/academics/registrar/final-approvals/${courseId}/course_result_details/`),

  approveCourseResults: (courseId: number, data: {
    action: 'approve' | 'reject';
    remarks?: string;
    override_anomalies?: boolean;
  }) => apiClient.post(`/academics/registrar/final-approvals/${courseId}/approve_course_results/`, data),

  getApprovalHistory: () =>
    apiClient.get('/academics/registrar/final-approvals/approval_history/'),

  // Student Clearance
  getClearanceCriteria: () =>
    apiClient.get('/academics/registrar/clearance/clearance_criteria/'),

  getPendingClearance: () =>
    apiClient.get('/academics/registrar/clearance/pending_clearance/'),

  getStudentClearanceDetail: (studentId: number) =>
    apiClient.get(`/academics/registrar/clearance/${studentId}/student_clearance_detail/`),

  processClearance: (studentId: number, data: {
    action: 'approve' | 'reject';
    remarks?: string;
    override?: boolean;
    justification?: string;
  }) => apiClient.post(`/academics/registrar/clearance/${studentId}/process_clearance/`, data),

  downloadClearanceReport: (params?: {
    department_id?: number;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const url = `/academics/registrar/clearance/clearance_report/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  // Profile
  getProfile: () => apiClient.get('/academics/registrar/profile/'),
};


// Add to your api.ts file:

// ========================
// ✅ ICT OFFICER API
// ========================
export const ictAPI = {
  getDashboard: () => apiClient.get('/auth/ict/dashboard/overview/'),

  // User Management
  getUserStatistics: () => apiClient.get('/auth/ict/user-management/user_statistics/'),

  searchUsers: (params?: {
    q?: string;
    role?: string;
    status?: string;
    department_id?: number;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.department_id) queryParams.append('department_id', params.department_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    // ✅ FIX: Ensure the base path is correct
    const url = `/auth/ict/user-management/search_users/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
  },

  // ... keep the rest of your ictAPI methods ...
  resetUserPassword: (userId: number, data: { new_password: string; confirm_password: string }) =>
    apiClient.post(`/auth/ict/user-management/${userId}/reset_password/`, data),

  toggleUserActiveStatus: (userId: number) =>
    apiClient.post(`/auth/ict/user-management/${userId}/toggle_active_status/`, {}),





  toggleUserStatus: (userId: number) =>
    apiClient.post(`/auth/ict/user-management/${userId}/toggle_active_status/`, {}),

  // Staff Account Creation (Linking to StaffAccountCreationViewSet)
  createLecturer: (data: any) => apiClient.post('/auth/ict/staff-accounts/create_lecturer_account/', data),
  createHOD: (data: any) => apiClient.post('/auth/ict/staff-accounts/create_hod_account/', data),
  createStaff: (role: string, data: any) => {
    // Map role to specific endpoint suffix if needed, or use a generic one if you built it
    const endpointMap: Record<string, string> = {
      'registrar': 'create_registrar_account',
      'bursar': 'create_bursar_account',
      'exam-officer': 'create_exam_officer_account',
      'desk-officer': 'create_desk_officer_account',
      'ict': 'create_ict_account'
    };
    return apiClient.post(`/auth/ict/staff-accounts/${endpointMap[role]}/`, data);
  },



  getUserActivity: (userId: number) =>
    apiClient.get(`/auth/ict/user-management/${userId}/user_activity/`),

  bulkUserActions: (data: { user_ids: number[]; action: 'activate' | 'deactivate' | 'delete' }) =>
    apiClient.post('/auth/ict/user-management/bulk_actions/', data),

  exportUsers: () => apiClient.get('/auth/ict/user-management/export_users/'),

  // Staff Account Creation
  getAccountCreationOptions: () =>
    apiClient.get('/auth/ict/staff-accounts/account_creation_options/'),

  createLecturerAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_lecturer_account/', data),

  createHODAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_hod_account/', data),

  createRegistrarAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_registrar_account/', data),

  createBursarAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_bursar_account/', data),

  createExamOfficerAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_exam_officer_account/', data),

  createDeskOfficerAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_desk_officer_account/', data),

  createICTAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_ict_account/', data),

  createSuperAdminAccount: (data: any) =>
    apiClient.post('/auth/ict/staff-accounts/create_super_admin_account/', data),

  bulkCreateAccounts: (accounts: any[]) =>
    apiClient.post('/auth/ict/staff-accounts/bulk_create_accounts/', { accounts }),

  // Password Management
  getPasswordResetRequests: () =>
    apiClient.get('/auth/ict/password-management/password_reset_requests/'),

  forcePasswordReset: (userIds: number[]) =>
    apiClient.post('/auth/ict/password-management/force_password_reset/', { user_ids: userIds }),

  getAccountLockoutStatus: () =>
    apiClient.get('/auth/ict/password-management/account_lockout_status/'),

  unlockAccount: (userId: number) =>
    apiClient.post(`/auth/ict/password-management/${userId}/unlock_account/`, {}),

  sendPasswordResetLinks: (userIds: number[]) =>
    apiClient.post('/auth/ict/password-management/send_password_reset_links/', { user_ids: userIds }),

  // System Configuration
  getCurrentConfiguration: () =>
    apiClient.get('/auth/ict/system-config/current_configuration/'),

  updateSystemSettings: (settings: any) =>
    apiClient.post('/auth/ict/system-config/update_system_settings/', { settings }),

  getDepartmentConfiguration: () =>
    apiClient.get('/auth/ict/system-config/department_configuration/'),

  updateDepartment: (data: { department_id: number; updates: any }) =>
    apiClient.post('/auth/ict/system-config/update_department/', data),

  createDepartment: (data: { name: string; code: string; description?: string }) =>
    apiClient.post('/auth/ict/system-config/create_department/', data),

  getSystemLogs: () => apiClient.get('/auth/ict/system-config/system_logs/'),

  // Profile
  getProfile: () => apiClient.get('/auth/ict/profile/'),
};

// ... (Previous code remains the same)

// Student Workflow API
export const workflowAPI = {
  // --- HOD Actions ---
  getPendingHODReviews: async () => {
    // Fetches courses with 'submitted' grades
    // Response is an array [] directly, so we return it as is.
    const response = await apiClient.get('/academics/workflow/hod/results/')
    return response // ✅ Removed .data
  },

  getCourseDetailsForHOD: async (courseId: number) => {
    const response = await apiClient.get(`/academics/workflow/hod/results/${courseId}/course_details/`)
    return response // ✅ Removed .data
  },

  approveResultHOD: async (courseId: number) => {
    return await apiClient.post('/academics/workflow/hod/results/approve/', { course_id: courseId })
  },

  rejectResultHOD: async (courseId: number, reason: string) => {
    return await apiClient.post('/academics/workflow/hod/results/reject/', { course_id: courseId, reason })
  },

  // --- Exam Officer Actions ---
  getPendingVerification: async () => {
    const response = await apiClient.get('/academics/workflow/exam-officer/results/pending_verification/')
    return response // ✅ Removed .data
  },

  verifyResult: async (courseId: number) => {
    return await apiClient.post('/academics/workflow/exam-officer/results/verify/', { course_id: courseId })
  },

  // --- Registrar Actions ---
  getPendingPublication: async () => {
    const response = await apiClient.get('/academics/workflow/registrar/results/pending_publication/')
    return response // ✅ Removed .data
  },

  publishResult: async (courseId: number) => {
    return await apiClient.post('/academics/workflow/registrar/results/publish/', { course_id: courseId })
  }
}

// ========================
// ✅ TRANSCRIPT API
// ========================
export const transcriptAPI = {
  getMyTranscript: async () => {
    return await apiClient.get('/academics/transcripts/my_transcript/')
  },

  generateTranscript: async (studentId: number) => {
    return await apiClient.get(`/academics/transcripts/generate/${studentId}/`)
  },




}


// Admin API - Aggregates functionality for Super Admin Dashboard
export const adminAPI = {
  // --- Departments ---
  getDepartments: () => apiClient.get('/academics/admin/departments/'),
  createDepartment: (data: any) => apiClient.post('/academics/admin/departments/', data),
  updateDepartment: (id: number, data: any) => apiClient.put(`/academics/admin/departments/${id}/`, data),
  deleteDepartment: (id: number) => apiClient.delete(`/academics/admin/departments/${id}/`),

  // Assign HOD
  assignHOD: (deptId: number, lecturerId: number) =>
    apiClient.post(`/academics/admin/departments/${deptId}/assign_hod/`, { lecturer_id: lecturerId }),

  // Get available lecturers for HOD dropdown
  getAvailableHODs: () => apiClient.get('/academics/admin/departments/available_hods/'),

  // --- Semesters (Sessions) ---
  // ✅ FIXED: Pointed to 'semesters' instead of 'academic-sessions'
  getSemesters: () => apiClient.get('/academics/admin/semesters/'),
  createSemester: (data: any) => apiClient.post('/academics/admin/semesters/', data),
  updateSemester: (id: number, data: any) => apiClient.put(`/academics/admin/semesters/${id}/`, data),
  deleteSemester: (id: number) => apiClient.delete(`/academics/admin/semesters/${id}/`),

  // --- Courses ---
  getCourses: () => apiClient.get('/academics/admin/courses/'),
  createCourse: (data: any) => apiClient.post('/academics/admin/courses/', data),
  updateCourse: (id: number, data: any) => apiClient.put(`/academics/admin/courses/${id}/`, data),
  deleteCourse: (id: number) => apiClient.delete(`/academics/admin/courses/${id}/`),

  // --- System ---
  startNewSession: (data: any) => apiClient.post('/academics/admin/management/start_new_session/', data),
  promoteStudents: (data: any) => apiClient.post('/academics/admin/management/promote_students/', data),
  getSystemHealth: () => apiClient.get('/academics/admin/system-health/overview/'),
};