import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manual .env parsing
const env = fs.readFileSync('.env', 'utf-8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=')
    if (key && val) acc[key.trim()] = val.join('=').trim()
    return acc
  }, {})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedAdmin() {
  const email = 'jvgajilomo.student@asiancollege.edu.ph'
  const password = '772004gajilomo'

  console.log(`Attempting to sign up admin: ${email} on ${supabaseUrl}`)

  // Using signUp to trigger the database trigger
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: 'Initial',
        last_name: 'Admin',
        role: 'admin',
        access_id: 'ADMIN-001'
      }
    }
  })

  if (authError && authError.message !== 'User already registered') {
    console.error('Signup error:', authError.message)
    // If it's something like "Email rate limit exceeded", we fallback to direct upsert after sign in attempt
  }

  // Attempt sign in to get the UID if already existing
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  })

  const userId = authData.user?.id || signInData.user?.id

  if (!userId) {
    console.error('Could not obtain User ID:', signInError?.message)
    return
  }

  console.log(`Obtained User ID: ${userId}. Performing upsert/update...`)

  // The database triggers will have created the profile record, but we force status and role.
  const { error: updateError } = await supabase
    .from('caregivers')
    .update({ 
      role: 'admin', 
      status: 'authorized',
      unique_access_id: 'ADMIN-001'
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Update profile error:', updateError.message)
    return
  }

  // Verify the changes
  const { data: profile } = await supabase
    .from('caregivers')
    .select('role, status')
    .eq('id', userId)
    .single()

  if (profile && profile.role === 'admin' && profile.status === 'authorized') {
    console.log('✅ DATABASE CONFIRMATION: Database reflects authorized admin role.')
  } else {
    console.error('❌ DISCREPANCY: Database state:', profile)
  }
}

seedAdmin()
