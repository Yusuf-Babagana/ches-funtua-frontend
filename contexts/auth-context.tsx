'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginData, RegisterData } from '@/types/auth';
import { authAPI } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string, shouldRedirect?: boolean) => Promise<User>;
    registerStudent: (userData: RegisterData, studentData: any) => Promise<void>;
    registerLecturer: (userData: RegisterData, lecturerData: any) => Promise<void>;
    registerStaff: (userData: RegisterData, staffData: any) => Promise<void>;
    registerHOD: (userData: RegisterData, hodData: any) => Promise<void>; // NEW

    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role to dashboard mapping
const roleDashboardMap: Record<string, string> = {
    'student': '/dashboard/student',
    'lecturer': '/dashboard/lecturer',
    'hod': '/dashboard/hod',
    'registrar': '/dashboard/registrar',
    'bursar': '/dashboard/bursar',
    'desk-officer': '/dashboard/desk-officer',
    'ict': '/dashboard/ict',
    'exam-officer': '/dashboard/exam-officer',
    'super-admin': '/dashboard/super-admin'
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        if (typeof window === 'undefined') {
            setLoading(false)
            return
        }

        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        console.log("🔄 Auth Initialization:", {
            hasToken: !!storedToken,
            hasUser: !!storedUser
        })

        if (storedToken && storedUser) {
            try {
                // Set user immediately from localStorage for instant UI
                const userData = JSON.parse(storedUser)
                setUser(userData)
                setToken(storedToken)
                console.log("✅ Auth: Set user from localStorage", userData.role)

                // Validate token in background, but don't block UI
                try {
                    await authAPI.getCurrentUser()
                    console.log("✅ Token validation successful")
                } catch (error) {
                    console.log("⚠️ Token validation failed, but keeping user logged in")
                    // Don't logout here - let the user stay logged in
                    // Individual API calls will handle authentication errors
                }
            } catch (error) {
                console.error("❌ Error during auth initialization:", error)
                // Don't clear storage on initialization errors
            }
        } else {
            console.log("🔐 No stored authentication found")
        }

        setLoading(false)
    }

    // In your lib/api.ts or auth context
    // In your auth context or API layer
    const login = async (email: string, password: string, shouldRedirect: boolean = true) => {
        try {
            const API_BASE = 'http://localhost:8000';
            const endpoint = `${API_BASE}/api/auth/login/`;

            console.log("🔄 [DEBUG] Calling Django login endpoint:", {
                endpoint,
                email,
                passwordLength: password.length
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                }),
            });

            console.log("📥 [DEBUG] Response status:", response.status);
            console.log("📥 [DEBUG] Response headers:", Object.fromEntries(response.headers.entries()));

            // Get the response text to see what Django is returning
            const responseText = await response.text();
            console.log("📥 [DEBUG] Full response text:", responseText);

            if (!response.ok) {
                // Try to parse the error response
                let errorDetail = `Login failed: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
                } catch (e) {
                    errorDetail = responseText || errorDetail;
                }
                throw new Error(errorDetail);
            }

            const data = JSON.parse(responseText);
            console.log("✅ [DEBUG] Login successful!");
            console.log("✅ [DEBUG] Full response data:", JSON.stringify(data, null, 2));
            console.log("✅ [DEBUG] User role from response:", data.user?.role);
            console.log("✅ [DEBUG] User object:", data.user);

            // Handle successful login
            setToken(data.access);
            setUser(data.user);
            localStorage.setItem('token', data.access);
            localStorage.setItem('user', JSON.stringify(data.user));

            const dashboardPath = roleDashboardMap[data.user.role] || '/dashboard';
            console.log("📍 [DEBUG] Role dashboard map:", roleDashboardMap);
            console.log("📍 [DEBUG] Mapped dashboard path for role", data.user.role, ":", dashboardPath);

            // Check if we're already on the correct page
            const currentPath = window.location.pathname;
            console.log("📍 [DEBUG] Current path:", currentPath);
            console.log("📍 [DEBUG] Target path:", dashboardPath);

            if (shouldRedirect) {
                if (currentPath !== dashboardPath) {
                    console.log("📍 [DEBUG] Redirecting to:", dashboardPath);
                    window.location.href = dashboardPath;
                } else {
                    console.log("📍 [DEBUG] Already on correct dashboard, reloading page");
                    window.location.reload();
                }
            }

            return data.user;

        } catch (error: any) {
            console.error('❌ [DEBUG] Login failed:', error);
            throw new Error(error.message || 'Login failed');
        }
    }

    // Temporary debug function to test the API directly
    const testLoginDirectly = async () => {
        console.log("🧪 [DEBUG] Testing login directly with fetch...");

        const testData = {
            email: "yau@gmail.com", // Use the email that worked
            password: "yourpassword" // Use the password that worked
        };

        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData),
                credentials: 'include'
            });

            console.log("🧪 [DEBUG] Direct fetch response status:", response.status);
            console.log("🧪 [DEBUG] Direct fetch response headers:", Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log("🧪 [DEBUG] Direct fetch response text:", responseText);

            if (response.ok) {
                const data = JSON.parse(responseText);
                console.log("🧪 [DEBUG] Direct fetch success:", data);
            } else {
                console.log("🧪 [DEBUG] Direct fetch error:", responseText);
            }
        } catch (error) {
            console.error("🧪 [DEBUG] Direct fetch exception:", error);
        }
    };

    // Call this temporarily in your component to test
    // useEffect(() => {
    //     testLoginDirectly();
    // }, []);



    const registerHOD = async (userData: RegisterData, hodData: any) => {
        try {
            const data = {
                user_data: userData,
                ...hodData
            };

            console.log('📤 Sending HOD data to Django:', data);

            const response: AuthResponse = await authAPI.registerHOD(data);

            setToken(response.access);
            setUser(response.user);

            localStorage.setItem('token', response.access);
            localStorage.setItem('user', JSON.stringify(response.user));
            if (response.department) {
                localStorage.setItem('hod_department', JSON.stringify(response.department));
            }

            console.log("✅ HOD registration successful, redirecting to HOD dashboard...");
            window.location.href = '/dashboard/hod';
        } catch (error: any) {
            console.error('❌ HOD registration failed:', error);
            throw new Error(error.detail || error.message || 'HOD registration failed');
        }
    };

    const registerStudent = async (userData: RegisterData, studentData: any) => {
        try {
            const data = {
                user_data: userData,
                matric_number: studentData.matric_number,
                level: studentData.level,
                department: studentData.department,
                admission_date: studentData.admission_date,
            };

            console.log('🔍 DEBUG - Data being sent to Django:', data);

            const response: AuthResponse = await authAPI.registerStudent(data);

            setToken(response.access);
            setUser(response.user);

            localStorage.setItem('token', response.access);
            localStorage.setItem('user', JSON.stringify(response.user));

            console.log("✅ Student registration successful, redirecting...");
            window.location.href = '/dashboard/student';
        } catch (error: any) {
            console.error('❌ Student registration failed:', error);
            let errorMsg = "Registration failed";
            if (error.detail) {
                errorMsg = error.detail;
            } else if (error.message) {
                errorMsg = error.message;
            } else if (error.user_data) {
                const fieldErrors = Object.entries(error.user_data)
                    .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                    .join(', ');
                errorMsg = fieldErrors || JSON.stringify(error);
            }
            throw new Error(errorMsg);
        }
    };

    const registerLecturer = async (userData: RegisterData, lecturerData: any) => {
        try {
            const data = {
                user_data: userData,
                ...lecturerData
            };

            console.log('📤 Sending lecturer data to Django:', data);

            const response: AuthResponse = await authAPI.registerLecturer(data);

            setToken(response.access);
            setUser(response.user);

            localStorage.setItem('token', response.access);
            localStorage.setItem('user', JSON.stringify(response.user));

            console.log("✅ Lecturer registration successful, redirecting...");
            window.location.href = '/dashboard/lecturer';
        } catch (error: any) {
            console.error('❌ Lecturer registration failed:', error);
            throw new Error(error.detail || error.message || 'Registration failed');
        }
    };

    const registerStaff = async (userData: RegisterData, staffData: any) => {
        try {
            const data = {
                user_data: userData,
                ...staffData
            };

            console.log('📤 Sending staff data to Django:', data);

            const response: AuthResponse = await authAPI.registerStaff(data);

            setToken(response.access);
            setUser(response.user);

            localStorage.setItem('token', response.access);
            localStorage.setItem('user', JSON.stringify(response.user));

            const dashboardPath = roleDashboardMap[response.user.role];
            console.log("✅ Staff registration successful, redirecting to:", dashboardPath);
            window.location.href = dashboardPath;
        } catch (error: any) {
            console.error('❌ Staff registration failed:', error);
            throw new Error(error.detail || error.message || 'Registration failed');
        }
    };

    const logout = () => {
        console.log("🚪 Logging out...");
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        registerStudent,
        registerLecturer,
        registerStaff,
        registerHOD, // NEW
        logout,
        isAuthenticated: !!token && !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}