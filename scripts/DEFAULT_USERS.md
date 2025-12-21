# Default Users for College Management System

This document lists all default users created in the system.

## How to Create Users

Run the following command to create all default users:

\`\`\`bash
npx tsx scripts/create-default-users.ts
\`\`\`

## Default User Credentials

### Staff Accounts

#### Super Admin
- **Email:** admin@chst.edu.ng
- **Password:** Admin@2024
- **Name:** System Administrator
- **Role:** Super Admin
- **Access:** Full system access, user management, audit logs

#### Registrar
- **Email:** registrar@chst.edu.ng
- **Password:** Registrar@2024
- **Name:** Chief Registrar
- **Role:** Registrar
- **Access:** Student registration, file management, applications

#### Desk Officer
- **Email:** desk@chst.edu.ng
- **Password:** Desk@2024
- **Name:** Desk Officer
- **Role:** Desk Officer
- **Access:** Payment verification, course registration approval

#### Head of Department (Nursing)
- **Email:** hod.nursing@chst.edu.ng
- **Password:** HOD@2024
- **Name:** Dr. Amina Bello
- **Role:** HOD
- **Department:** Nursing
- **Access:** Department management, course management, lecturer assignment

#### Head of Department (Medical Laboratory Science)
- **Email:** hod.medical@chst.edu.ng
- **Password:** HOD@2024
- **Name:** Dr. Ibrahim Musa
- **Role:** HOD
- **Department:** Medical Laboratory Science
- **Access:** Department management, course management, lecturer assignment

#### Lecturer (Nursing)
- **Email:** lecturer.nursing@chst.edu.ng
- **Password:** Lecturer@2024
- **Name:** Mrs. Fatima Yusuf
- **Role:** Lecturer
- **Department:** Nursing
- **Access:** Course materials, attendance tracking, grade management

#### Lecturer (Medical Laboratory Science)
- **Email:** lecturer.medical@chst.edu.ng
- **Password:** Lecturer@2024
- **Name:** Mr. Usman Abdullahi
- **Role:** Lecturer
- **Department:** Medical Laboratory Science
- **Access:** Course materials, attendance tracking, grade management

### Student Accounts

#### Student 1
- **Email:** student001@chst.edu.ng
- **Password:** Student@2024
- **Name:** Aisha Mohammed
- **Role:** Student
- **Department:** Nursing
- **Access:** Course registration, grades, payments, attendance

#### Student 2
- **Email:** student002@chst.edu.ng
- **Password:** Student@2024
- **Name:** Musa Ibrahim
- **Role:** Student
- **Department:** Medical Laboratory Science
- **Access:** Course registration, grades, payments, attendance

#### Student 3
- **Email:** student003@chst.edu.ng
- **Password:** Student@2024
- **Name:** Zainab Suleiman
- **Role:** Student
- **Department:** Nursing
- **Access:** Course registration, grades, payments, attendance

## Security Notes

⚠️ **IMPORTANT:** These are default credentials for initial setup. Users should be required to change their passwords on first login in a production environment.

## Next Steps

After creating users:
1. Run the database migration scripts in order (001, 002, 003, 004)
2. Run the user creation script
3. Test login with each role
4. Implement password change on first login (recommended for production)
