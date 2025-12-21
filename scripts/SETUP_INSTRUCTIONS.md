# Database Setup Instructions

## Step 1: Run the SQL Script in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `setup-database.sql`
6. Paste it into the SQL editor
7. Click "Run" to execute the script

This will create all necessary tables, enable Row Level Security, and set up the trigger to auto-create user profiles.

## Step 2: Create Default Users

After the database schema is set up:

1. Visit `/admin-setup` in your application
2. Click "Create All Default Users"
3. The system will create 14 users:
   - 1 Super Admin
   - 1 Registrar
   - 1 Desk Officer
   - 1 HOD
   - 1 Lecturer
   - 10 Students

## Step 3: Login

Use any of the credentials provided to log in and test the system.

## Troubleshooting

If you get errors about tables not existing:
- Make sure you ran the SQL script in Step 1
- Check the Supabase logs for any errors
- Verify the tables were created in the "Table Editor" section

If users aren't being created:
- Check that the trigger `on_auth_user_created` exists
- Verify RLS policies are enabled
- Check the Supabase Auth logs for errors
