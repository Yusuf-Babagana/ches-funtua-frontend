# College Management System - Complete Dashboard Guide

## System Overview

The **College Management System** is a comprehensive web-based platform designed for the **College of Health and Environmental Sciences Funtua**, located in Tudun Wada Funtua, Katsina State. This system streamlines administrative, academic, and financial operations across the institution by providing role-based dashboards for all stakeholders including students, faculty, administrative staff, and super administrators.

Built with **Next.js 15**, **React**, **TypeScript**, and **Tailwind CSS**, the system integrates with a **Django REST Framework (DRF)** backend API to manage users, courses, grades, payments, applications, and more.

---

## Architecture

### Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API (Auth)
- **HTTP Client**: Fetch API

### Backend Integration
- **API**: Django REST Framework (DRF)
- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api`)
- **Authentication**: Token-based (stores token in localStorage)
- **Data Format**: JSON

### Key Directories
\`\`\`
app/
├── dashboard/
│   ├── student/         # Student portal
│   ├── lecturer/        # Lecturer portal
│   ├── hod/            # Head of Department portal
│   ├── registrar/      # Registrar portal
│   ├── bursar/         # Bursar portal
│   ├── desk-officer/   # Desk Officer portal
│   ├── ict/            # ICT Officer portal
│   ├── exam-officer/   # Exam Officer portal
│   └── super-admin/    # Super Admin portal
├── login/              # Login page
└── page.tsx            # Landing page

components/
├── ui/                 # shadcn/ui components
└── dashboard/          # Dashboard-specific components

contexts/
└── auth-context.tsx    # Authentication context

lib/
├── api.ts              # API client
├── mock-data.ts        # Empty (mock data removed)
└── utils.ts            # Utility functions
\`\`\`

---

## User Roles & Access Control

The system implements **9 distinct user roles**, each with specific permissions and dashboard views:

### 1. Student
**Access Level**: Limited to personal academic records  
**Dashboard Route**: `/dashboard/student`

#### Features:
- **Dashboard Overview**: View enrolled courses, recent grades, payment status
- **Courses**: Browse enrolled courses with details (code, credits, lecturer, semester)
- **Grades**: View academic performance across all semesters with GPA calculation
- **Payments**: Check payment history and outstanding fees

#### Key Pages:
- `/dashboard/student` - Main dashboard
- `/dashboard/student/courses` - Course enrollment
- `/dashboard/student/grades` - Grade reports
- `/dashboard/student/payments` - Financial records

---

### 2. Lecturer
**Access Level**: Access to assigned courses and student records  
**Dashboard Route**: `/dashboard/lecturer`

#### Features:
- **Dashboard Overview**: View assigned courses, total students, recent attendance
- **Courses**: Manage assigned courses and course materials
- **Grades**: Submit and manage student grades for assigned courses
- **Attendance**: Record and track student attendance

#### Key Pages:
- `/dashboard/lecturer` - Main dashboard
- `/dashboard/lecturer/courses` - Assigned courses
- `/dashboard/lecturer/grades` - Grade management
- `/dashboard/lecturer/attendance` - Attendance tracking

---

### 3. Head of Department (HOD)
**Access Level**: Department-wide oversight  
**Dashboard Route**: `/dashboard/hod`

#### Features:
- **Dashboard Overview**: Department statistics (total courses, lecturers, students)
- **Courses**: Manage department courses (create, edit, assign lecturers)
- **Lecturers**: View and manage department faculty

#### Key Pages:
- `/dashboard/hod` - Main dashboard
- `/dashboard/hod/courses` - Department course management
- `/dashboard/hod/lecturers` - Faculty management

---

### 4. Registrar
**Access Level**: Student records and applications  
**Dashboard Route**: `/dashboard/registrar`

#### Features:
- **Dashboard Overview**: Application statistics, student records
- **Students**: Comprehensive student database (search, filter, edit records)
- **Applications**: Review and process admission applications (approve/reject)

#### Key Pages:
- `/dashboard/registrar` - Main dashboard
- `/dashboard/registrar/students` - Student records management
- `/dashboard/registrar/applications` - Application processing

---

### 5. Bursar
**Access Level**: Financial operations  
**Dashboard Route**: `/dashboard/bursar`

#### Features:
- **Dashboard Overview**: Financial statistics (total revenue, pending payments, collection rate)
- **Revenue Chart**: Monthly revenue visualization
- **Recent Payments**: Track latest transactions

#### Key Pages:
- `/dashboard/bursar` - Financial dashboard

---

### 6. Desk Officer
**Access Level**: Student registration and payments  
**Dashboard Route**: `/dashboard/desk-officer`

#### Features:
- **Dashboard Overview**: Registration and payment statistics
- **Registration**: Process student registrations (search, verify, register courses)
- **Payments**: Record and verify payments

#### Key Pages:
- `/dashboard/desk-officer` - Main dashboard
- `/dashboard/desk-officer/registration` - Student registration
- `/dashboard/desk-officer/payments` - Payment processing

---

### 7. ICT Officer
**Access Level**: Technical support and registration assistance  
**Dashboard Route**: `/dashboard/ict`

#### Features:
- **Dashboard Overview**: System statistics (active users, system health)
- **Registration**: Assist with student registrations

#### Key Pages:
- `/dashboard/ict` - Main dashboard
- `/dashboard/ict/registration` - Registration support

---

### 8. Exam Officer
**Access Level**: Examination management  
**Dashboard Route**: `/dashboard/exam-officer`

#### Features:
- **Dashboard Overview**: Exam schedule and statistics
- **Exam Management**: Create and manage examination schedules
- **Results Processing**: Review and approve student results
- **Eligibility Verification**: Track students eligible for examinations
- **Graduation Tracking**: Monitor students ready for graduation

#### Key Pages:
- `/dashboard/exam-officer` - Main dashboard

---

### 9. Super Admin
**Access Level**: Full system access and control  
**Dashboard Route**: `/dashboard/super-admin`

#### Features:
- **Dashboard Overview**: System-wide statistics (total users by role)
- **User Management**: Create, edit, delete users across all roles
- **Audit Logs**: Track all system activities with timestamps

#### Key Pages:
- `/dashboard/super-admin` - Main dashboard
- `/dashboard/super-admin/users` - User management
- `/dashboard/super-admin/audit` - System audit logs

---

## Authentication System

### Login Flow
1. User visits `/login`
2. Enters email and password
3. System sends POST request to `/auth/login/`
4. Backend returns JWT token and user data
5. Token stored in `localStorage`
6. User redirected to role-specific dashboard

### Auth Context (`contexts/auth-context.tsx`)
Provides global authentication state:
- `user`: Current user object
- `token`: JWT authentication token
- `login(email, password)`: Login function
- `logout()`: Logout function
- `isAuthenticated`: Boolean authentication status

### Protected Routes
All dashboard routes are protected via `ProtectedRoute` component that:
- Checks authentication status
- Validates user role matches route requirements
- Redirects to login if unauthenticated
- Shows error if role mismatch

---

## API Integration

### API Client (`lib/api.ts`)

The system uses a centralized API client that:
- Automatically includes authentication tokens
- Handles errors globally
- Supports GET, POST, PUT, DELETE methods
- Base URL: `process.env.NEXT_PUBLIC_API_URL` or `http://localhost:8000/api`

#### Key API Functions:
\`\`\`typescript
// Authentication
login(email: string, password: string)

// Users
fetchUsers(role?: string)
createUser(userData: User)
updateUser(id: string, userData: User)
deleteUser(id: string)

// Students
fetchStudents()
updateStudent(id: string, data: Student)

// Courses
fetchCourses()
createCourse(data: Course)
updateCourse(id: string, data: Course)

// Grades
fetchGrades(studentId?: string)
submitGrade(data: Grade)

// Payments
fetchPayments(studentId?: string)
recordPayment(data: Payment)

// Applications
fetchApplications()
updateApplicationStatus(id: string, status: string)

// Audit Logs
fetchAuditLogs()
\`\`\`

### Expected Backend Endpoints

Your Django DRF backend should implement these endpoints:

#### Authentication
- `POST /auth/login/` - Login with email/password
- `POST /auth/logout/` - Logout

#### Users
- `GET /users/` - List all users (optionally filter by role)
- `POST /users/` - Create user
- `GET /users/{id}/` - Get user details
- `PUT /users/{id}/` - Update user
- `DELETE /users/{id}/` - Delete user

#### Students
- `GET /students/` - List all students
- `GET /students/{id}/` - Get student details
- `PUT /students/{id}/` - Update student

#### Courses
- `GET /courses/` - List all courses
- `POST /courses/` - Create course
- `GET /courses/{id}/` - Get course details
- `PUT /courses/{id}/` - Update course
- `DELETE /courses/{id}/` - Delete course

#### Grades
- `GET /grades/` - List grades (optionally filter by student_id)
- `POST /grades/` - Submit grade
- `PUT /grades/{id}/` - Update grade

#### Payments
- `GET /payments/` - List payments (optionally filter by student_id)
- `POST /payments/` - Record payment

#### Applications
- `GET /applications/` - List applications
- `PUT /applications/{id}/` - Update application status

#### Audit Logs
- `GET /audit-logs/` - List all system audit logs

---

## Data Models

### User
\`\`\`typescript
interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'lecturer' | 'hod' | 'registrar' | 'bursar' | 
        'desk-officer' | 'ict' | 'exam-officer' | 'super-admin'
  department?: string
  createdAt: string
}
\`\`\`

### Student
\`\`\`typescript
interface Student {
  id: string
  matricNumber: string
  name: string
  email: string
  department: string
  level: string
  status: 'active' | 'inactive' | 'graduated'
  enrolledCourses: string[]
}
\`\`\`

### Course
\`\`\`typescript
interface Course {
  id: string
  code: string
  title: string
  credits: number
  department: string
  semester: string
  lecturer: string
  description?: string
}
\`\`\`

### Grade
\`\`\`typescript
interface Grade {
  id: string
  studentId: string
  courseId: string
  score: number
  grade: string // A, B, C, D, F
  semester: string
  session: string
}
\`\`\`

### Payment
\`\`\`typescript
interface Payment {
  id: string
  studentId: string
  amount: number
  description: string
  status: 'pending' | 'completed' | 'failed'
  date: string
}
\`\`\`

### Application
\`\`\`typescript
interface Application {
  id: string
  applicantName: string
  email: string
  phone: string
  department: string
  program: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}
\`\`\`

### AuditLog
\`\`\`typescript
interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
}
\`\`\`

---

## Key Features

### 1. Role-Based Dashboards
Each role has a custom dashboard showing relevant metrics and quick actions.

### 2. Responsive Design
Fully responsive across mobile, tablet, and desktop devices using Tailwind CSS breakpoints.

### 3. Data Tables
Advanced tables with:
- Search functionality
- Filtering by status/role
- Pagination (future enhancement)
- Sort capabilities
- Bulk actions

### 4. Charts & Analytics
- Bar charts for revenue (Bursar)
- Line charts for trends
- Stat cards for KPIs

### 5. Forms & Validation
- User creation/editing forms
- Grade submission forms
- Payment recording forms
- Application review forms

### 6. Loading States
Dedicated loading pages (`loading.tsx`) provide skeleton UIs during data fetch.

### 7. Error Handling
- Toast notifications for success/error messages
- Form validation errors
- API error handling

---

## Setup & Configuration

### Environment Variables
Create `.env.local` file or add via Vercel dashboard:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:8000/api
\`\`\`

For production, you can set this in the **Vars** section of the v0 in-chat sidebar.

### Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

### Backend Requirements
Ensure your Django backend:
- Runs on `http://localhost:8000`
- Has CORS enabled for `http://localhost:3000`
- Returns JSON responses
- Uses token-based authentication
- Implements all required endpoints listed above

### CORS Configuration (Django)
\`\`\`python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-production-domain.com",
]
\`\`\`

---

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for instant updates
2. **File Uploads**: Support for documents, transcripts, receipts
3. **Email Integration**: Automated email notifications
4. **Reports**: PDF generation for transcripts, receipts
5. **Calendar**: Academic calendar and event scheduling
6. **Messaging**: Internal messaging system
7. **Advanced Analytics**: More detailed charts and insights
8. **Mobile App**: React Native companion app
9. **Biometric Attendance**: Fingerprint/facial recognition
10. **SMS Notifications**: Payment reminders and alerts

---

## Troubleshooting

### Common Issues

**Issue**: "Failed to fetch" errors  
**Solution**: Ensure your Django backend is running and CORS is properly configured.

**Issue**: Authentication not persisting  
**Solution**: Check that the token is being stored in localStorage and included in API requests.

**Issue**: Empty dashboards  
**Solution**: Verify that your backend endpoints are returning data in the expected format.

**Issue**: Role-based routing not working  
**Solution**: Ensure the user object returned from login includes the correct `role` field.

---

## Support & Maintenance

For technical support or feature requests, contact the ICT department or system administrator. The system is designed to be maintainable and scalable as the college's needs grow.

---

**College of Health and Environmental Sciences Funtua**  
Tudun Wada Funtua, Katsina State  
© 2025 All Rights Reserved
