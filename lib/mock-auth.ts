import type { User } from "./mock-data"

export type UserRole =
  | "super_admin"
  | "registrar"
  | "desk_officer"
  | "hod"
  | "lecturer"
  | "student"
  | "bursar"
  | "exam_officer"
  | "ict"

export type { User }

export const mockUsers: User[] = []

export function authenticateUser(email: string, password: string): User | null {
  console.warn("authenticateUser called in production mode. Use API for authentication.")
  return null
}
