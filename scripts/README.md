# Database Setup Instructions

## Running the Scripts

The SQL scripts should be run in order:

1. **001_create_tables.sql** - Creates all database tables
2. **002_create_rls_policies.sql** - Sets up Row Level Security policies
3. **003_create_triggers.sql** - Creates triggers for auto-updates
4. **004_seed_default_users.sql** - Seeds departments and sample data

## Creating Default Users

Since Supabase requires users to be created through the Auth system, you have two options:

### Option 1: Create via Supabase Dashboard
1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user" and create each default user with their email and password
3. After creating auth users, their profiles will be automatically created via the trigger

### Option 2: Create via Sign-up API (Recommended)
Use the sign-up functionality in the app with metadata:

\`\`\`typescript
const { data, error } = await supabase.auth.signUp({
  email: 'admin@college.edu',
  password: 'SecurePassword123!',
  options: {
    data: {
      full_name: 'System Administrator',
      role: 'super_admin'
    }
  }
})
\`\`\`

## Default User Accounts

Create these accounts for testing:

- **Super Admin**: admin@college.edu
- **Registrar**: registrar@college.edu  
- **Desk Officer**: desk@college.edu
- **HOD**: hod@college.edu
- **Lecturer**: lecturer@college.edu
- **Student 1**: alice.johnson@student.college.edu
- **Student 2**: bob.smith@student.college.edu
- **Student 3**: carol.williams@student.college.edu

All passwords should be set securely (minimum 8 characters).

## Important Notes

- The trigger `handle_new_user()` automatically creates a user profile when someone signs up
- RLS policies are enforced on all tables for security
- Students need to have a corresponding entry in the `students` table after their user profile is created
- Department IDs are fixed UUIDs for consistency across environments
