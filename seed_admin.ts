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

  console.log(`Obtained User ID: ${userId}. Updating profile in caregivers table...`)

  // The trigger 'on_auth_user_created' / 'handle_new_user' might have already created the record
  // But we want to ensure it's 'admin' and 'authorized'
  const { error: upsertError } = await supabase
    .from('caregivers')
    .upsert({
      id: userId,
      role: 'admin',
      status: 'authorized',
      email: email,
      first_name: 'Initial',
      last_name: 'Admin',
      unique_access_id: 'ADMIN-001'
    })

  if (upsertError) {
    console.error('Upsert profile error:', upsertError.message)
    return
  }

  // Double check
  const { data: profile } = await supabase
    .from('caregivers')
    .select('role, status')
    .eq('id', userId)
    .single()

  if (profile && profile.role === 'admin' && profile.status === 'authorized') {
    console.log('✅ DATABASE CONFIRMATION: Admin user is now registered and authorized.')
  } else {
    console.error('❌ FAILED: Database does not reflect changes as expected.', profile)
  }
}

seedAdmin()
