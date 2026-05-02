import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedAdmin() {
  const email = 'jvgajilomo.student@asiancollege.edu.ph'
  const password = '772004gajilomo'

  console.log(`Attempting to sign up admin: ${email}`)

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Initial Admin',
        role: 'admin',
        access_id: 'ADMIN-001'
      }
    }
  })

  // If user already exists, we might get an error but we still want to try updating the profile
  if (authError && authError.message !== 'User already registered') {
    console.error('Signup error:', authError.message)
    return
  }

  const userId = authData.user?.id || (await supabase.auth.signInWithPassword({ email, password })).data.user?.id

  if (!userId) {
    console.error('Could not obtain User ID')
    return
  }

  console.log(`Obtained User ID: ${userId}. Updating profile in system_users table...`)

  // Ensure record exists in system_users
  const { error: upsertError } = await supabase
    .from('system_users')
    .upsert({
      user_id: userId,
      role: 'admin',
      status: 'authorized',
      email: email,
      full_name: 'Initial Admin',
      access_id: 'ADMIN-001',
      is_active: true
    }, { onConflict: 'email' })

  if (upsertError) {
    console.error('Upsert profile error:', upsertError.message)
    return
  }

  // Double check
  const { data: profile } = await supabase
    .from('system_users')
    .select('role, status')
    .eq('email', email)
    .maybeSingle()

  if (profile && profile.role === 'admin' && profile.status === 'authorized') {
    console.log('✅ DATABASE CONFIRMATION: Admin user is now registered and authorized.')
  } else {
    console.error('❌ FAILED: Database does not reflect changes as expected.', profile)
  }
}

seedAdmin()
