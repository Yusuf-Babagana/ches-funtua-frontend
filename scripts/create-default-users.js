import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const defaultUsers = [
  {
    email: "admin@chsth.edu.ng",
    password: "Admin@2024",
    full_name: "System Administrator",
    role: "super_admin",
    department_id: null,
  },
  {
    email: "registrar@chsth.edu.ng",
    password: "Registrar@2024",
    full_name: "College Registrar",
    role: "registrar",
    department_id: null,
  },
  {
    email: "desk@chsth.edu.ng",
    password: "Desk@2024",
    full_name: "Desk Officer",
    role: "desk_officer",
    department_id: null,
  },
  {
    email: "hod.cs@chsth.edu.ng",
    password: "HOD@2024",
    full_name: "Dr. Ibrahim Musa",
    role: "hod",
    department_id: 1, // Computer Science
  },
  {
    email: "hod.nursing@chsth.edu.ng",
    password: "HOD@2024",
    full_name: "Dr. Fatima Abdullahi",
    role: "hod",
    department_id: 2, // Nursing
  },
  {
    email: "lecturer.cs@chsth.edu.ng",
    password: "Lecturer@2024",
    full_name: "Mr. Usman Aliyu",
    role: "lecturer",
    department_id: 1, // Computer Science
  },
  {
    email: "lecturer.nursing@chsth.edu.ng",
    password: "Lecturer@2024",
    full_name: "Mrs. Aisha Mohammed",
    role: "lecturer",
    department_id: 2, // Nursing
  },
  {
    email: "student1@chsth.edu.ng",
    password: "Student@2024",
    full_name: "Maryam Hassan",
    role: "student",
    department_id: 2, // Nursing
  },
  {
    email: "student2@chsth.edu.ng",
    password: "Student@2024",
    full_name: "Yusuf Ibrahim",
    role: "student",
    department_id: 3, // Medical Laboratory Science
  },
  {
    email: "student3@chsth.edu.ng",
    password: "Student@2024",
    full_name: "Zainab Suleiman",
    role: "student",
    department_id: 2, // Nursing
  },
]

async function createDefaultUsers() {
  console.log("Creating default users...\n")

  for (const user of defaultUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      })

      if (authError) {
        console.error(`❌ Failed to create ${user.email}:`, authError.message)
        continue
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: user.full_name,
          role: user.role,
          department_id: user.department_id,
        })
        .eq("id", authData.user.id)

      if (profileError) {
        console.error(`❌ Failed to update profile for ${user.email}:`, profileError.message)
        continue
      }

      console.log(`✅ Created ${user.role}: ${user.email}`)
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message)
    }
  }

  console.log("\n✨ Default users created successfully!\n")
  console.log("Login Credentials:")
  console.log("==================")
  defaultUsers.forEach((user) => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`)
  })
}

createDefaultUsers()
