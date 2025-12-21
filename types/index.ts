// types/index.ts
export type UserRole =
    | "student"
    | "lecturer"
    | "hod"
    | "registrar"
    | "bursar"
    | "desk-officer"
    | "ict"
    | "exam-officer"
    | "super-admin"

export interface User {
    id: string
    email: string
    username: string
    first_name: string
    last_name: string
    full_name?: string
    role: UserRole
    department?: number | null
    is_active: boolean
    date_joined: string
}

// Role-specific profiles
export interface StudentProfile {
    id: string
    user: string
    matric_number: string
    level: string
    department: number
    admission_date: string
    status: "active" | "inactive" | "graduated"
}

export interface LecturerProfile {
    id: string
    user: string
    staff_id: string
    department: number
    designation: string
    is_hod: boolean
}

export interface StaffProfile {
    id: string
    user: string
    staff_id: string
    position: string
    department?: number | null
    office_location?: string
}

export type UserProfile = StudentProfile | LecturerProfile | StaffProfile


// Add these to your existing types/index.ts

export interface CourseResultSummary {
    id: number
    code: string
    title: string
    lecturer_name: string
    department_name: string
    level: string
    semester_display: string
    total_students: number
    passed_count: number
    failed_count: number
    average_score: number
    status_summary: string
}

export interface GradeDetail {
    grade_id: number
    student_name: string
    matric: string
    total: number
    grade: string
    remarks: string
}