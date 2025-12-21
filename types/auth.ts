export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: 'student' | 'lecturer' | 'hod' | 'registrar' | 'bursar' |
    'desk-officer' | 'ict' | 'exam-officer' | 'super-admin';
    phone: string;
    profile_picture?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    department_id?: number;
    department_name?: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
    profile?: any;
    department?: any;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role?: string; // For staff registration
}