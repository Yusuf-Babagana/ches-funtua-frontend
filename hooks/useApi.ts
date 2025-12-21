import { useState, useCallback } from 'react'
import { authAPI } from '@/lib/api' // Import the specific API client
import type { ApiError } from '@/lib/types'

interface UseApiOptions {
    onSuccess?: (data: any) => void
    onError?: (error: ApiError) => void
}

export function useApi<T>() {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)

    const execute = useCallback(async (
        apiCall: () => Promise<T>,
        options: UseApiOptions = {}
    ) => {
        setLoading(true)
        setError(null)

        try {
            const result = await apiCall()
            setData(result)
            options.onSuccess?.(result)
            return result
        } catch (err: any) {
            const apiError: ApiError = err.detail ? err : { detail: err.message || 'An error occurred' }
            setError(apiError)
            options.onError?.(apiError)
            throw apiError
        } finally {
            setLoading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setLoading(false)
    }, [])

    return {
        data,
        loading,
        error,
        execute,
        reset,
    }
}

// ✅ CORRECT: Create specific hooks that use the right endpoints
export function useStudentRegistration() {
    const { execute, ...state } = useApi()

    const registerStudent = useCallback((data: any) =>
        execute(() => authAPI.registerStudent(data)), [execute])

    return { registerStudent, ...state }
}

export function useStaffRegistration() {
    const { execute, ...state } = useApi()

    const registerStaff = useCallback((data: any) =>
        execute(() => authAPI.registerStaff(data)), [execute])

    return { registerStaff, ...state }
}