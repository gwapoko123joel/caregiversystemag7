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

  // Update both legacy and new profile tables
  console.log(`Updating system_users for ${email}...`)
  const { error: systemUserError } = await supabase
    .from('system_users')
    .update({ 
      user_id: userId,
      role: 'admin',
      status: 'authorized',
      is_active: true
    })
    .eq('access_id', 'ADMIN-001')

  if (systemUserError) {
    console.warn('System user update warning (may not exist yet):', systemUserError.message)
    // If it doesn't exist, we should probably insert it
    await supabase.from('system_users').upsert({
      user_id: userId,
      email: email,
      full_name: 'Initial Admin',
      role: 'admin',
      access_id: 'ADMIN-001',
      status: 'authorized',
      is_active: true
    })
  }

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
    .from('system_users')
    .select('role, status, user_id')
    .eq('access_id', 'ADMIN-001')
    .single()

  if (profile && profile.role === 'admin' && profile.status === 'authorized' && profile.user_id === userId) {
    console.log('✅ DATABASE CONFIRMATION: system_users reflects authorized admin role.')
  } else {
    console.error('❌ DISCREPANCY: system_users state:', profile)
  }
}

seedAdmin()
