// Real data types matching Django backend models

export type UserRole =
    | 'student'
    | 'lecturer'
    | 'hod'
    | 'registrar'
    | 'bursar'
    | 'desk-officer'
    | 'ict'
    | 'exam-officer'
    | 'super-admin'

export interface User {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    full_name: string
    role: UserRole
    phone?: string
    profile_picture?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Department {
    id: number
    code: string
    name: string
    description?: string
    hod?: {
        id: number
        name?: string  // Make optional
        staff_id?: string  // Make optional
        email?: string  // Make optional
    }
    created_at: string
    student_count?: number
    lecturer_count?: number
    course_count?: number
}

export interface Student {
    id: number
    user: User
    matric_number: string
    level: string
    department: Department
    status: 'active' | 'inactive' | 'graduated' | 'suspended'
    admission_date: string
    date_of_birth?: string
    address?: string
    guardian_name?: string
    guardian_phone?: string
    created_at: string
    updated_at: string
}

export interface Lecturer {
    id: number
    user: {
        id: number
        first_name: string
        last_name: string
        full_name: string
        email: string
    }
    staff_id: string
    department: {
        id: number
        name: string
        code: string
    }
    designation: string
    is_hod: boolean
}

export interface StaffProfile {
    id: number
    user: User
    staff_id: string
    department?: string
    position: string
    office_location?: string
    created_at: string
    updated_at: string
}

export interface Course {
    id: number
    code: string
    title: string
    department: Department
    level: number
    semester: number
    credits: number
    lecturer?: number // User ID
    is_elective: boolean
}

export interface Enrollment {
    id: number
    student: number // User ID
    course: Course
    session: string
    semester: number
    enrollment_date: string
    status: 'active' | 'completed' | 'dropped'
}

export interface Grade {
    id: number
    student: number // User ID
    course: Course
    enrollment: Enrollment
    score: number
    grade_letter: string
    session: string
    semester: number
    uploaded_by: number // User ID
    created_at: string
}

export interface Attendance {
    id: number
    student: number // User ID
    course: Course
    date: string
    status: 'present' | 'absent'
    marked_by: number // User ID
}

export interface FeeStructure {
    id: number
    name: string
    description?: string
    level: string
    department: Department
    tuition_fee: number
    library_fee: number
    lab_fee: number
    sports_fee: number
    medical_fee: number
    other_fees: number
    session: string
    is_active: boolean
    created_at: string
    updated_at: string
    total_fee: number
}

export interface Invoice {
    id: number
    invoice_number: string
    student: number // User ID
    fee_structure: FeeStructure
    session: string
    semester: string
    amount: number
    amount_paid: number
    balance: number
    status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
    due_date: string
    description: string
    created_at: string
    updated_at: string
}

export interface Payment {
    id: number
    reference_id: string
    student: number // User ID
    invoice?: number // Invoice ID
    amount: number
    payment_method: 'bank_transfer' | 'card' | 'cash' | 'pos' | 'online'
    description: string
    status: 'pending' | 'completed' | 'failed' | 'reversed'
    transaction_reference?: string
    payment_date?: string
    verified_by?: number // User ID
    remarks?: string
    created_at: string
    updated_at: string
}

export interface AuditLog {
    id: number
    user: number // User ID
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'download' | 'upload'
    model_name: string
    object_id?: string
    description: string
    ip_address?: string
    user_agent?: string
    changes: Record<string, any>
    timestamp: string
}

// API Response types
export interface AuthResponse {
    access: string
    refresh: string
    user: User
    profile?: Student | Lecturer | StaffProfile
}

export interface ApiError {
    detail: string
    code?: string
    [key: string]: any // For field-specific errors
}

// Remove all mock data since we're using real API