'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
            // User doesn't have required role, redirect to their dashboard
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

            const userDashboard = roleDashboardMap[user.role] || '/dashboard';
            router.push(userDashboard);
        }
    }, [isAuthenticated, loading, user, requiredRole, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return null;
    }

    return <>{children}</>;
}